import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const AGENT_CLI_CANDIDATES = [
  "/Applications/YouNavi.app/Contents/Resources/backend/agent-cli",
  "/Applications/YouNavi Internal.app/Contents/Resources/backend/agent-cli",
  "/Applications/YouNavi Debug.app/Contents/Resources/backend/agent-cli",
];

export const PERSONA_MANIFEST = Object.freeze({
  naval: {
    displayName: "Naval Ravikant",
    skillName: "naval-perspective",
    source: "https://github.com/alchaincyf/naval-skill",
    commit: "259e452ef6f6c2bfdbe30368f7c85bc683fe1949",
  },
  musk: {
    displayName: "Elon Musk",
    skillName: "elon-musk-perspective",
    source: "https://github.com/alchaincyf/elon-musk-skill",
    commit: "5a7d8cf0f23ca6071d18ed8c5c80e8996459a443",
  },
  jobs: {
    displayName: "Steve Jobs",
    skillName: "steve-jobs-perspective",
    source: "https://github.com/alchaincyf/steve-jobs-skill",
    commit: "cd724b0e2e2d9e83a436063b5b915294b5925d28",
  },
  trump: {
    displayName: "Donald John Trump",
    skillName: "trump-perspective",
    source: "https://github.com/alchaincyf/trump-skill",
    commit: "4bdb94895a01a84b9f55d90ae5889747c0736757",
  },
  pg: {
    displayName: "Paul Graham",
    skillName: "paul-graham-perspective",
    source: "https://github.com/alchaincyf/paul-graham-skill",
    commit: "8de3d2bf4e0c301ea3caf015b189307f8d8d8dc0",
  },
});

export const COMMAND_MANIFEST = Object.freeze({
  explain: {
    code: "EXPLAIN",
    label: "解释",
    instruction: "补齐背景、关键概念、因果链和历史逻辑。",
    sections: ["重新定义", "背景与逻辑", "关键判断", "证据与未知"],
  },
  review: {
    code: "REVIEW",
    label: "评审",
    instruction: "评审当前方案，指出成立条件、明显风险和需要补证的部分。",
    sections: ["结论", "成立条件", "风险", "证据与未知"],
  },
  decide: {
    code: "DECIDE",
    label: "决策",
    instruction: "比较可选方案、代价和不可逆风险，并给出明确建议。",
    sections: ["建议", "方案比较", "代价", "下一判断点"],
  },
  action: {
    code: "ACTION",
    label: "行动",
    instruction: "整理可执行的下一步、负责人、验收标准与风险。",
    sections: ["判断", "行动", "风险", "证据"],
  },
});

export class PersonaNaviError extends Error {
  constructor(message, { code = "PERSONA_NAVI_ERROR", status = 400 } = {}) {
    super(message);
    this.name = "PersonaNaviError";
    this.code = code;
    this.status = status;
  }
}

function cleanText(value, { name, max, required = true }) {
  const text = String(value ?? "").replace(/\0/g, "").trim();
  if (required && !text) throw new PersonaNaviError(`${name}不能为空`, { code: "INVALID_RUN" });
  if (text.length > max) throw new PersonaNaviError(`${name}不能超过 ${max} 字符`, { code: "INVALID_RUN" });
  return text;
}

export function validateRunPayload(payload) {
  if (!payload || payload.schema !== "persona.navi-run/v1") {
    throw new PersonaNaviError("不支持的 Persona Run schema", { code: "INVALID_RUN" });
  }
  const runId = cleanText(payload.runId, { name: "runId", max: 80 });
  if (!/^prun-[a-z0-9-]{12,72}$/i.test(runId)) {
    throw new PersonaNaviError("runId 格式无效", { code: "INVALID_RUN" });
  }
  const personaId = cleanText(payload.personaId, { name: "personaId", max: 32 });
  const commandId = cleanText(payload.commandId, { name: "commandId", max: 32 });
  const persona = PERSONA_MANIFEST[personaId];
  const command = COMMAND_MANIFEST[commandId];
  if (!persona) throw new PersonaNaviError("人物卡不在服务端白名单", { code: "UNKNOWN_PERSONA" });
  if (!command) throw new PersonaNaviError("指令卡不在服务端白名单", { code: "UNKNOWN_COMMAND" });
  const task = cleanText(payload.task, { name: "当前任务", max: 4000 });
  const rawMaterials = Array.isArray(payload.materials) ? payload.materials : [];
  if (rawMaterials.length > 12) throw new PersonaNaviError("素材不能超过 12 项", { code: "INVALID_RUN" });
  const materials = rawMaterials.map((item, index) => ({
    id: cleanText(item?.id, { name: `素材 ${index + 1} ID`, max: 64 }),
    name: cleanText(item?.name, { name: `素材 ${index + 1} 名称`, max: 160 }),
    meta: cleanText(item?.meta, { name: `素材 ${index + 1} 说明`, max: 240, required: false }),
  }));
  return { schema: payload.schema, runId, personaId, commandId, task, materials, persona, command };
}

export function renderPersonaPrompt(run) {
  const materialLines = run.materials.length
    ? run.materials.map((item, index) => `${index + 1}. ${item.name}${item.meta ? `（${item.meta}）` : ""}`)
    : ["无额外素材"];
  return [
    `/${run.persona.skillName}`,
    "",
    "# Persona Driver Run",
    "",
    `- Persona Card: ${run.persona.displayName}`,
    `- Command: ${run.command.code} / ${run.command.label}`,
    `- Run ID: ${run.runId}`,
    "",
    "## 当前任务",
    "",
    run.task,
    "",
    "## 已选输入（演示元数据）",
    "",
    "以下条目只有名称和说明，没有文件路径或正文。不要声称已经读取文件；只能把它们当作待补充的输入索引。",
    "",
    ...materialLines,
    "",
    "## 指令",
    "",
    run.command.instruction,
    "",
    "## 输出合同",
    "",
    `请用 Markdown 输出以下栏目：${run.command.sections.join(" / ")}。`,
    "明确区分事实、推断和未知；不要把角色推断写成已证实事实。",
    "",
  ].join("\n");
}

export async function resolveAgentCli(candidates = AGENT_CLI_CANDIDATES) {
  const configured = process.env.PERSONA_NAVI_AGENT_CLI;
  for (const candidate of configured ? [configured, ...candidates] : candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next installed application.
    }
  }
  throw new PersonaNaviError("找不到 YouNavi agent-cli", { code: "AGENT_CLI_MISSING", status: 503 });
}

export function execAgentCli(cli, args, { timeout = 90_000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(cli, args, { timeout, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        reject(new PersonaNaviError(
          String(stderr || stdout || error?.message || "agent-cli 返回无法解析").trim().slice(0, 1200),
          { code: "AGENT_CLI_INVALID_RESPONSE", status: 502 },
        ));
        return;
      }
      if (error && parsed?.success !== false) {
        reject(new PersonaNaviError(String(stderr || error.message).trim().slice(0, 1200), {
          code: "AGENT_CLI_FAILED",
          status: 502,
        }));
        return;
      }
      resolve(parsed);
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function prepareYouNaviRuntime({ resolveCli = resolveAgentCli, runCli = execAgentCli } = {}) {
  await openYouNavi();
  const cli = await resolveCli();
  const deadline = Date.now() + 30_000;
  let lastError = "YouNavi 后端尚未就绪";
  while (Date.now() < deadline) {
    try {
      const result = await runCli(cli, ["--no-auto-start", "--format", "json", "auth", "me"], { timeout: 5_000 });
      if (result?.success) return cli;
      lastError = result?.error || lastError;
    } catch (error) {
      lastError = String(error?.message || error).slice(0, 500);
    }
    await delay(750);
  }
  throw new PersonaNaviError(`YouNavi 启动后仍未就绪：${lastError}`, {
    code: "NAVI_BACKEND_NOT_READY",
    status: 503,
  });
}

async function readJson(file, { required = true } = {}) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (!required && error?.code === "ENOENT") return null;
    throw new PersonaNaviError("Persona Run 本地记录缺失或损坏", { code: "INVALID_RUN_RECORD", status: 409 });
  }
}

async function writeJsonAtomic(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

export async function inspectInstalledSkills(skillsDir) {
  const result = {};
  for (const [personaId, persona] of Object.entries(PERSONA_MANIFEST)) {
    const skillPath = path.join(skillsDir, persona.skillName, "SKILL.md");
    try {
      const body = await readFile(skillPath, "utf8");
      const declaredName = body.match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim() ?? "";
      result[personaId] = {
        installed: declaredName === persona.skillName,
        skillName: persona.skillName,
        sha256: createHash("sha256").update(body).digest("hex"),
        error: declaredName === persona.skillName ? null : "SKILL.md name 与 manifest 不一致",
      };
    } catch {
      result[personaId] = { installed: false, skillName: persona.skillName, sha256: null, error: "SKILL.md 不可读" };
    }
  }
  return result;
}

function cliData(result, operation) {
  if (!result?.success) {
    throw new PersonaNaviError(result?.error || `${operation}失败`, {
      code: result?.code || "NAVI_CLI_ERROR",
      status: result?.code === "AUTH_REQUIRED" ? 401 : 502,
    });
  }
  return result.data ?? {};
}

function taskStatus(data) {
  const task = data?.task && typeof data.task === "object" ? data.task : data;
  return String(task?.status ?? data?.status ?? task?.state ?? data?.state ?? "running").toLowerCase();
}

export function createPersonaRunService({
  runRoot,
  skillsDir,
  resolveCli = resolveAgentCli,
  runCli = execAgentCli,
  prepareRuntime = prepareYouNaviRuntime,
}) {
  const inFlight = new Map();

  async function createRun(payload) {
    const run = validateRunPayload(payload);
    if (inFlight.has(run.runId)) return inFlight.get(run.runId);
    const work = (async () => {
      const directory = path.join(runRoot, run.runId);
      const receiptPath = path.join(directory, "receipt.json");
      const requestPath = path.join(directory, "request.json");
      const existing = await readJson(receiptPath, { required: false });
      if (existing?.ok && existing.runId === run.runId) return { ...existing, idempotent: true };
      if (await readJson(requestPath, { required: false })) {
        throw new PersonaNaviError("这次 Run 已发送但缺少最终回执；为避免重复对话，不会自动重发", {
          code: "RUN_CREATION_UNKNOWN",
          status: 409,
        });
      }

      await mkdir(directory, { recursive: true });
      const skills = await inspectInstalledSkills(skillsDir);
      const installed = skills[run.personaId];
      if (!installed?.installed) {
        throw new PersonaNaviError(`YouNavi 未安装 ${run.persona.skillName}`, { code: "SKILL_MISSING", status: 409 });
      }
      const prompt = renderPersonaPrompt(run);
      const title = `PERSONA RIDE · ${run.persona.displayName} · ${run.command.code}`.slice(0, 100);
      const cli = await prepareRuntime({ resolveCli, runCli });
      await writeJsonAtomic(requestPath, {
        ...run,
        persona: { ...run.persona, skillSha256: installed.sha256 },
        prompt,
        title,
        createdAt: new Date().toISOString(),
      });
      const data = cliData(await runCli(cli, [
        "--no-auto-start", "--format", "json", "chat", "send", prompt,
        "--task-type", "chat", "--source", "persona-driver", "--title", title,
      ]), "创建 Navi 对话");
      const receipt = {
        ok: true,
        schema: "persona.navi-receipt/v1",
        runId: run.runId,
        personaId: run.personaId,
        skillName: run.persona.skillName,
        skillSha256: installed.sha256,
        commandId: run.commandId,
        taskId: data.task_id ?? null,
        conversationId: data.conversation_id ?? null,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      if (!receipt.taskId || !receipt.conversationId) {
        throw new PersonaNaviError("Navi 回执缺少 task_id / conversation_id", {
          code: "INVALID_NAVI_RECEIPT",
          status: 502,
        });
      }
      await writeJsonAtomic(receiptPath, receipt);
      return receipt;
    })();
    inFlight.set(run.runId, work);
    try {
      return await work;
    } finally {
      inFlight.delete(run.runId);
    }
  }

  async function readRun(runId) {
    if (!/^prun-[a-z0-9-]{12,72}$/i.test(runId)) {
      throw new PersonaNaviError("runId 格式无效", { code: "INVALID_RUN" });
    }
    const receipt = await readJson(path.join(runRoot, runId, "receipt.json"));
    if (!receipt?.ok || receipt.runId !== runId || !receipt.taskId || !receipt.conversationId) {
      throw new PersonaNaviError("Persona Run 回执不完整", { code: "INVALID_RUN_RECORD", status: 409 });
    }
    const cli = await resolveCli();
    const task = cliData(await runCli(cli, [
      "--no-auto-start", "--format", "json", "task", "show", receipt.taskId,
    ]), "查询 Navi 任务");
    const status = taskStatus(task);
    if (["error", "failed", "cancelled", "canceled"].includes(status)) {
      const record = task?.task && typeof task.task === "object" ? task.task : task;
      return {
        ok: true,
        ...receipt,
        status: status.startsWith("cancel") ? "cancelled" : "error",
        error: String(
          record?.error_message ?? record?.error ?? record?.message
            ?? task?.error_message ?? task?.error ?? task?.message
            ?? "Navi 任务执行失败",
        ).slice(0, 1200),
      };
    }
    if (!["success", "completed", "complete"].includes(status)) {
      return { ok: true, ...receipt, status: status === "pending" ? "pending" : "running" };
    }
    const conversation = cliData(await runCli(cli, [
      "--no-auto-start", "--format", "json", "convo", "show", receipt.conversationId, "--no-paged",
    ]), "读取 Navi 对话");
    const message = (Array.isArray(conversation.messages) ? conversation.messages : []).filter((item) => (
      item?.role === "assistant"
      && item.is_complete === true
      && item.task_id === receipt.taskId
      && typeof item.content === "string"
      && item.content.trim()
    )).at(-1);
    if (!message) return { ok: true, ...receipt, status: "running" };
    if (Buffer.byteLength(message.content, "utf8") > 2 * 1024 * 1024) {
      throw new PersonaNaviError("Navi 回复超过 2MB", { code: "RESULT_TOO_LARGE", status: 413 });
    }
    const result = {
      ok: true,
      ...receipt,
      status: "completed",
      messageId: message.message_id ?? null,
      contentMarkdown: message.content,
      completedAt: message.created_at ?? new Date().toISOString(),
    };
    await writeJsonAtomic(path.join(runRoot, runId, "result.json"), result);
    return result;
  }

  return { createRun, readRun };
}

export function openYouNavi() {
  return new Promise((resolve, reject) => {
    execFile("/usr/bin/open", ["-a", "YouNavi"], { timeout: 15_000 }, (error) => {
      if (error) {
        reject(new PersonaNaviError("无法打开 YouNavi 应用", { code: "OPEN_NAVI_FAILED", status: 502 }));
        return;
      }
      resolve({ ok: true });
    });
  });
}
