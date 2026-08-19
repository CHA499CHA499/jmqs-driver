import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PERSONA_MANIFEST,
  createPersonaRunService,
  inspectInstalledSkills,
  renderPersonaPrompt,
  validateRunPayload,
} from "../scripts/persona-navi-bridge-lib.mjs";

function run(overrides = {}) {
  return {
    schema: "persona.navi-run/v1",
    runId: "prun-123456789abc",
    personaId: "trump",
    commandId: "action",
    task: "整理产品上线的下一步",
    materials: [{ id: "roadmap", name: "产品路线图.md", meta: "12 KB · 产品" }],
    ...overrides,
  };
}

test("uses the five verified YouNavi skill names", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(PERSONA_MANIFEST).map(([id, item]) => [id, item.skillName])), {
    naval: "naval-perspective",
    musk: "elon-musk-perspective",
    jobs: "steve-jobs-perspective",
    trump: "trump-perspective",
    pg: "paul-graham-perspective",
  });
});

test("renders a slash skill, command, task, inputs and output contract", () => {
  const prompt = renderPersonaPrompt(validateRunPayload(run()));
  assert.match(prompt, /^\/trump-perspective/m);
  assert.match(prompt, /Persona Card: Donald John Trump/);
  assert.match(prompt, /Command: ACTION \/ 行动/);
  assert.match(prompt, /整理产品上线的下一步/);
  assert.match(prompt, /产品路线图\.md/);
  assert.match(prompt, /不要声称已经读取文件/);
  assert.match(prompt, /判断 \/ 行动 \/ 风险 \/ 证据/);
});

test("rejects unknown personas and excessive material input", () => {
  assert.throws(() => validateRunPayload(run({ personaId: "unknown" })), /白名单/);
  assert.throws(() => validateRunPayload(run({ materials: Array.from({ length: 13 }, (_, index) => ({
    id: `m${index}`, name: `material-${index}`, meta: "demo",
  })) })), /12 项/);
});

test("creates one idempotent Navi conversation receipt", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "persona-navi-test-"));
  const skillsDir = path.join(root, "skills");
  const runRoot = path.join(root, "runs");
  for (const persona of Object.values(PERSONA_MANIFEST)) {
    const directory = path.join(skillsDir, persona.skillName);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "SKILL.md"), `---\nname: ${persona.skillName}\ndescription: test\n---\n`, "utf8");
  }
  let sends = 0;
  const service = createPersonaRunService({
    runRoot,
    skillsDir,
    resolveCli: async () => "/mock/agent-cli",
    prepareRuntime: async () => "/mock/agent-cli",
    runCli: async (_cli, args) => {
      sends += 1;
      assert.deepEqual(args.slice(0, 5), ["--no-auto-start", "--format", "json", "chat", "send"]);
      return { success: true, data: { task_id: "task-1", conversation_id: "conversation-1" } };
    },
  });
  const first = await service.createRun(run());
  const second = await service.createRun(run());
  assert.equal(first.taskId, "task-1");
  assert.equal(second.idempotent, true);
  assert.equal(sends, 1);
});

test("detects a mismatched installed Skill name", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "persona-skill-test-"));
  const target = path.join(root, PERSONA_MANIFEST.trump.skillName);
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "SKILL.md"), "---\nname: wrong-name\n---\n", "utf8");
  const skills = await inspectInstalledSkills(root);
  assert.equal(skills.trump.installed, false);
});

test("returns the real Navi task error for visible recovery", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "persona-error-test-"));
  const skillsDir = path.join(root, "skills");
  const target = path.join(skillsDir, PERSONA_MANIFEST.trump.skillName);
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "SKILL.md"), "---\nname: trump-perspective\n---\n", "utf8");
  const service = createPersonaRunService({
    runRoot: path.join(root, "runs"),
    skillsDir,
    resolveCli: async () => "/mock/agent-cli",
    prepareRuntime: async () => "/mock/agent-cli",
    runCli: async (_cli, args) => args.includes("send")
      ? { success: true, data: { task_id: "task-error", conversation_id: "conversation-error" } }
      : { success: true, data: { task: { status: "error", error_message: "upstream returned HTTP 400" } } },
  });
  await service.createRun(run());
  const result = await service.readRun(run().runId);
  assert.equal(result.status, "error");
  assert.equal(result.error, "upstream returned HTTP 400");
});
