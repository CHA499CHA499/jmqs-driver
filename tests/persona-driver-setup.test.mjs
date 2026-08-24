import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(new URL("..", import.meta.url).pathname);
const setup = path.join(root, ".agents", "skills", "persona-driver-setup", "scripts", "setup.mjs");
const skillNames = ["naval-perspective", "elon-musk-perspective", "steve-jobs-perspective", "trump-perspective", "paul-graham-perspective", "create-soul"];

test("setup doctor validates the bundled materials and six YouNavi Skills without login work", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "persona-driver-setup-"));
  const skillsDir = path.join(temporary, "skills");
  try {
    for (const name of skillNames) {
      const directory = path.join(skillsDir, name);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, "SKILL.md"), `---\nname: ${name}\ndescription: fixture\n---\n`, "utf8");
    }
    const { stdout } = await execFileAsync(process.execPath, [setup, "doctor", "--project", root, "--skills-dir", skillsDir]);
    const report = JSON.parse(stdout);
    assert.equal(report.materials.count, 4);
    assert.match(report.materials.root, /materials\/classic-interviews$/);
    assert.equal(report.skills.length, 6);
    assert.equal(report.ready, true);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("the project and parent trigger tables expose the setup Skill", async () => {
  const [rootSkill, internalSkill, setupScript, localAgents, parentAgents] = await Promise.all([
    readFile(path.join(root, "SKILL.md"), "utf8"),
    readFile(path.join(root, ".agents", "skills", "persona-driver-setup", "SKILL.md"), "utf8"),
    readFile(setup, "utf8"),
    readFile(path.join(root, "AGENTS.md"), "utf8"),
    readFile(path.resolve(root, "..", "..", "AGENTS.md"), "utf8"),
  ]);
  assert.match(rootSkill, /^name: persona-driver$/m);
  assert.match(rootSkill, /^exposure: on-trigger$/m);
  assert.match(rootSkill, /\$\{SKILL_DIR\}\/\.agents\/skills\/persona-driver-setup\/scripts\/setup\.mjs/);
  assert.match(rootSkill, /--no-start --no-open/);
  assert.match(internalSkill, /^name: persona-driver-setup$/m);
  assert.match(internalSkill, /^exposure: manual$/m);
  assert.match(internalSkill, /public YouNavi entry is/);
  assert.match(setupScript, /provisioned: true/);
  assert.match(localAgents, /`SKILL\.md`（YouNavi 根入口/);
  assert.match(parentAgents, /bridge-persona-atlas-site\/SKILL\.md/);
});

test("setup doctor infers the YouNavi Skills root when the whole project is imported as one root Skill", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "persona-driver-root-skill-"));
  const skillsDir = path.join(temporary, "skills");
  const projectRoot = path.join(skillsDir, "persona-driver");
  try {
    await mkdir(path.join(projectRoot, "scripts"), { recursive: true });
    await mkdir(path.join(projectRoot, "app"), { recursive: true });
    await cp(path.join(root, "materials"), path.join(projectRoot, "materials"), { recursive: true });
    await cp(path.join(root, "scripts", "persona-navi-bridge-lib.mjs"), path.join(projectRoot, "scripts", "persona-navi-bridge-lib.mjs"));
    await cp(path.join(root, "app", "run-result-presentation.mjs"), path.join(projectRoot, "app", "run-result-presentation.mjs"));
    await cp(path.join(root, "app", "persona-run-contract.mjs"), path.join(projectRoot, "app", "persona-run-contract.mjs"));
    await writeFile(path.join(projectRoot, "package.json"), JSON.stringify({ name: "persona-driver" }), "utf8");
    await writeFile(path.join(projectRoot, "SKILL.md"), "---\nname: persona-driver\ndescription: fixture\n---\n", "utf8");
    for (const name of skillNames) {
      const directory = path.join(skillsDir, name);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, "SKILL.md"), `---\nname: ${name}\ndescription: fixture\n---\n`, "utf8");
    }

    const { stdout } = await execFileAsync(process.execPath, [setup, "doctor", "--project", projectRoot]);
    const report = JSON.parse(stdout);
    assert.equal(report.ready, true);
    assert.equal(report.materials.count, 4);
    assert.equal(report.skills.length, 6);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
