#!/usr/bin/env node

import { createHash } from "node:crypto";
import { openSync, closeSync } from "node:fs";
import { access, cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execFile, spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(SCRIPT_DIR, "..");
const BUNDLED_CREATE_SOUL = path.join(SKILL_ROOT, "assets", "create-soul");
const MIN_NODE = [22, 13, 0];

function parseArgs(argv) {
  const command = argv[0] && !argv[0].startsWith("--") ? argv.shift() : "install";
  const options = { command, project: null, skillsDir: null, skipTests: false, noOpen: false, noStart: false };
  while (argv.length) {
    const arg = argv.shift();
    if (arg === "--project") options.project = argv.shift();
    else if (arg === "--skills-dir") options.skillsDir = argv.shift();
    else if (arg === "--skip-tests") options.skipTests = true;
    else if (arg === "--no-open") options.noOpen = true;
    else if (arg === "--no-start") options.noStart = true;
    else throw new Error(`未知参数：${arg}`);
  }
  if (!["doctor", "install", "start"].includes(command)) throw new Error(`未知模式：${command}`);
  return options;
}

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

function versionAtLeast(actual, minimum) {
  const parts = actual.replace(/^v/, "").split(".").map((item) => Number(item) || 0);
  for (let index = 0; index < minimum.length; index += 1) {
    if ((parts[index] || 0) > minimum[index]) return true;
    if ((parts[index] || 0) < minimum[index]) return false;
  }
  return true;
}

async function findProjectRoot(start) {
  let current = path.resolve(start);
  while (true) {
    const packagePath = path.join(current, "package.json");
    if (await exists(packagePath)) {
      const pkg = JSON.parse(await readFile(packagePath, "utf8"));
      if (pkg.name === "persona-driver") return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function resolveProjectRoot(explicit) {
  if (explicit) {
    const found = await findProjectRoot(explicit);
    if (!found) throw new Error(`找不到 Persona Driver 项目：${explicit}`);
    return found;
  }
  return await findProjectRoot(process.cwd()) || await findProjectRoot(path.resolve(SKILL_ROOT, "../../.."))
    || (() => { throw new Error("找不到 Persona Driver 项目；请传 --project <path>"); })();
}

function loadProjectEnv(projectRoot) {
  try { process.loadEnvFile(path.join(projectRoot, ".env.local")); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function resolveSkillsDir(projectRoot, explicit) {
  const configured = explicit || process.env.PERSONA_NAVI_SKILLS_DIR;
  if (configured) return path.resolve(configured);
  const parent = path.dirname(SKILL_ROOT);
  if (path.basename(parent) === "skills" && path.basename(path.dirname(parent)) !== ".agents") return parent;
  const localCandidate = path.join(projectRoot, ".local", "skills");
  if (await exists(localCandidate)) return localCandidate;
  throw new Error("无法确定 YouNavi Skills 目录；请传 --skills-dir 或设置 PERSONA_NAVI_SKILLS_DIR");
}

function declaredSkillName(body) {
  return body.match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim() || "";
}

async function inspectSkill(target, expectedName) {
  const skillFile = path.join(target, "SKILL.md");
  if (!await exists(skillFile)) return { installed: false, reason: "SKILL.md 不存在" };
  const name = declaredSkillName(await readFile(skillFile, "utf8"));
  return name === expectedName
    ? { installed: true, reason: "已安装" }
    : { installed: false, reason: `已存在但 name=${name || "空"}` };
}

async function copySkill(source, target, expectedName) {
  const existing = await inspectSkill(target, expectedName);
  if (existing.installed) return "kept";
  if (await exists(target)) throw new Error(`${target} ${existing.reason}；为避免覆盖，已停止`);
  const sourceCheck = await inspectSkill(source, expectedName);
  if (!sourceCheck.installed) throw new Error(`内置 Skill 无效：${source}（${sourceCheck.reason}）`);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, {
    recursive: true,
    filter: (entry) => path.basename(entry) !== ".DS_Store" && !entry.split(path.sep).includes(".git"),
  });
  return "installed";
}

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} 退出码 ${code}`)));
  });
}

async function clonePinnedSkill({ name, source, commit }, target) {
  const existing = await inspectSkill(target, name);
  if (existing.installed) return "kept";
  if (await exists(target)) throw new Error(`${target} ${existing.reason}；为避免覆盖，已停止`);
  const temporary = await mkdtemp(path.join(os.tmpdir(), `persona-driver-${name}-`));
  try {
    await run("git", ["init", "-q"], { cwd: temporary });
    await run("git", ["remote", "add", "origin", source], { cwd: temporary });
    await run("git", ["fetch", "--depth", "1", "origin", commit], { cwd: temporary });
    await run("git", ["checkout", "-q", "--detach", "FETCH_HEAD"], { cwd: temporary });
    return await copySkill(temporary, target, name);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function verifyMaterials(projectRoot) {
  const root = path.join(projectRoot, "materials", "classic-interviews");
  const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
  if (manifest.schema !== "persona-driver.material-bundle/v1" || !Array.isArray(manifest.files)) {
    throw new Error("内置材料 manifest 无效");
  }
  for (const item of manifest.files) {
    const file = path.join(root, item.name);
    const body = await readFile(file);
    const metadata = await stat(file);
    const sha256 = createHash("sha256").update(body).digest("hex");
    if (metadata.size !== item.bytes || sha256 !== item.sha256) throw new Error(`内置材料校验失败：${item.name}`);
  }
  return { root, count: manifest.files.length };
}

async function writeEnv(projectRoot, values) {
  const file = path.join(projectRoot, ".env.local");
  const source = await readFile(file, "utf8").catch(() => "");
  let lines = source.split(/\r?\n/).filter((line, index, values_) => line || index < values_.length - 1);
  for (const [key, value] of Object.entries(values)) {
    const next = `${key}=${JSON.stringify(value)}`;
    const index = lines.findIndex((line) => line.startsWith(`${key}=`));
    if (index >= 0) lines[index] = next;
    else lines.push(next);
  }
  await writeFile(file, `${lines.filter(Boolean).join("\n")}\n`, "utf8");
}

async function fetchStatus(url) {
  try {
    const { stdout } = await execFileAsync("curl", ["--noproxy", "*", "-sS", "-m", "3", "-w", "\n%{http_code}", url]);
    const lines = stdout.split("\n");
    const status = Number(lines.pop()) || 0;
    const text = lines.join("\n");
    let body = null;
    try { body = JSON.parse(text); } catch { /* The web root is HTML. */ }
    return { ok: status >= 200 && status < 300, status, body };
  } catch (error) {
    return { ok: false, status: 0, error: String(error?.message || error) };
  }
}

async function waitForRuntime(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [web, bridge] = await Promise.all([
      fetchStatus("http://localhost:3000/"),
      fetchStatus("http://127.0.0.1:8766/health"),
    ]);
    if (web.ok && bridge.ok && bridge.body?.ok) return { web, bridge };
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Persona Driver 未在 60 秒内 ready；查看 .local/persona-runtime.log");
}

async function startRuntime(projectRoot, noOpen) {
  const current = await Promise.all([
    fetchStatus("http://localhost:3000/"),
    fetchStatus("http://127.0.0.1:8766/health"),
  ]);
  if (!(current[0].ok && current[1].ok && current[1].body?.ok)) {
    const localRoot = path.join(projectRoot, ".local");
    await mkdir(localRoot, { recursive: true });
    const logPath = path.join(localRoot, "persona-runtime.log");
    const descriptor = openSync(logPath, "a");
    const child = spawn("npm", ["run", "dev"], {
      cwd: projectRoot,
      env: process.env,
      detached: true,
      stdio: ["ignore", descriptor, descriptor],
    });
    child.unref();
    closeSync(descriptor);
    await writeFile(path.join(localRoot, "persona-runtime.pid"), `${child.pid}\n`, "utf8");
  }
  const ready = await waitForRuntime();
  if (!noOpen && process.platform === "darwin") await execFileAsync("/usr/bin/open", ["http://localhost:3000/"]);
  return ready;
}

async function doctor(projectRoot, skillsDir) {
  const materials = await verifyMaterials(projectRoot);
  const bridgeLib = await import(pathToFileURL(path.join(projectRoot, "scripts", "persona-navi-bridge-lib.mjs")).href);
  const skills = [];
  for (const persona of Object.values(bridgeLib.PERSONA_MANIFEST)) {
    skills.push({ name: persona.skillName, ...(await inspectSkill(path.join(skillsDir, persona.skillName), persona.skillName)) });
  }
  skills.push({ name: "create-soul", ...(await inspectSkill(path.join(skillsDir, "create-soul"), "create-soul")) });
  return { materials, skills, ready: skills.every((item) => item.installed) };
}

async function main() {
  if (!versionAtLeast(process.version, MIN_NODE)) throw new Error(`需要 Node >= ${MIN_NODE.join(".")}，当前 ${process.version}`);
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = await resolveProjectRoot(options.project);
  loadProjectEnv(projectRoot);
  const skillsDir = await resolveSkillsDir(projectRoot, options.skillsDir);
  const soulWorkspace = path.dirname(skillsDir);
  const materials = await verifyMaterials(projectRoot);

  if (options.command === "doctor") {
    const report = await doctor(projectRoot, skillsDir);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.ready) process.exitCode = 2;
    return;
  }

  if (options.command === "install") {
    await mkdir(skillsDir, { recursive: true });
    const bridgeLib = await import(pathToFileURL(path.join(projectRoot, "scripts", "persona-navi-bridge-lib.mjs")).href);
    for (const persona of Object.values(bridgeLib.PERSONA_MANIFEST)) {
      await clonePinnedSkill({ name: persona.skillName, source: persona.source, commit: persona.commit }, path.join(skillsDir, persona.skillName));
    }
    await copySkill(BUNDLED_CREATE_SOUL, path.join(skillsDir, "create-soul"), "create-soul");
    await writeEnv(projectRoot, {
      PERSONA_NAVI_SKILLS_DIR: skillsDir,
      PERSONA_NAVI_MATERIAL_ROOT: materials.root,
      PERSONA_NAVI_SOUL_WORKSPACE_ROOT: soulWorkspace,
    });
    await run("npm", ["ci"], { cwd: projectRoot });
    if (!options.skipTests) await run("npm", ["test"], { cwd: projectRoot });
  } else {
    const report = await doctor(projectRoot, skillsDir);
    if (!report.ready) throw new Error("Skills 尚未完整安装；请先运行 install 模式");
  }

  if (options.noStart) {
    process.stdout.write(`${JSON.stringify({ ok: true, provisioned: true, projectRoot, skillsDir, materialRoot: materials.root }, null, 2)}\n`);
    return;
  }
  const ready = await startRuntime(projectRoot, options.noOpen);
  process.stdout.write(`${JSON.stringify({ ok: true, projectRoot, skillsDir, materialRoot: materials.root, web: ready.web.status, bridge: ready.bridge.status }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Persona Driver Setup 失败：${String(error?.message || error)}\n`);
  process.exitCode = 1;
});
