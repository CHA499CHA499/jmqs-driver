import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  const [skill, setupScript, localAgents, parentAgents] = await Promise.all([
    readFile(path.join(root, ".agents", "skills", "persona-driver-setup", "SKILL.md"), "utf8"),
    readFile(setup, "utf8"),
    readFile(path.join(root, "AGENTS.md"), "utf8"),
    readFile(path.resolve(root, "..", "..", "AGENTS.md"), "utf8"),
  ]);
  assert.match(skill, /^name: persona-driver-setup$/m);
  assert.match(skill, /^exposure: on-trigger$/m);
  assert.match(skill, /--no-start --no-open/);
  assert.match(setupScript, /provisioned: true/);
  assert.match(localAgents, /persona-driver-setup\/SKILL\.md/);
  assert.match(parentAgents, /persona-driver-setup\/SKILL\.md/);
});
