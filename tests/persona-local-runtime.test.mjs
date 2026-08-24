import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createLocalRuntimeSupervisor } from "../scripts/persona-local-runtime.mjs";

function fakeChild(pid) {
  const child = new EventEmitter();
  child.pid = pid;
  child.killed = false;
  child.kill = () => { child.killed = true; };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

test("default dev uses the supervisor and supervisor launches dev:web plus Bridge", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const supervisor = await readFile(new URL("../scripts/persona-local-runtime.mjs", import.meta.url), "utf8");
  assert.equal(packageJson.scripts.dev, "node scripts/persona-local-runtime.mjs");
  assert.match(packageJson.scripts["dev:web"], /vinext dev/);
  assert.equal(packageJson.scripts["dev:persona"], "node scripts/persona-local-runtime.mjs");
  assert.match(supervisor, /\["run", "dev:web", "--", "--port", String\(webPort\)\]/);
  assert.match(supervisor, /BRIDGE_READY/);
  assert.match(supervisor, /BRIDGE_RESTART_SCHEDULED/);
});

test("supervisor waits for Bridge health before ready and does not duplicate existing ports", async () => {
  const spawned = [];
  const logs = [];
  const output = [];
  const supervisor = createLocalRuntimeSupervisor({
    bridgePort: 18766,
    webPort: 13000,
    probePort: async () => false,
    health: async () => true,
    webHealth: async () => true,
    spawnChild: (label, command, args) => { const child = fakeChild(100 + spawned.length); spawned.push({ label, command, args, child }); return child; },
    logEvent: async (event, extra) => logs.push({ event, ...extra }),
    write: (value) => output.push(value),
  });
  await supervisor.start();
  assert.deepEqual(spawned.map((item) => [item.label, item.command, item.args]), [["bridge", process.execPath, ["scripts/persona-navi-bridge.mjs"]], ["web", "npm", ["run", "dev:web", "--", "--port", "13000"]]]);
  assert.match(output[0], /Persona local runtime ready/);
  assert.equal(logs.some((item) => item.code === "BRIDGE_READY"), true);
  await supervisor.shutdown("test");
  assert.equal(spawned.every((item) => item.child.killed), true);

  const duplicateSpawned = [];
  const duplicate = createLocalRuntimeSupervisor({
    bridgePort: 18766,
    webPort: 13000,
    probePort: async () => true,
    health: async () => true,
    webHealth: async () => true,
    spawnChild: (...args) => { duplicateSpawned.push(args); return fakeChild(999); },
    logEvent: async () => {},
  });
  await duplicate.start();
  assert.equal(duplicateSpawned.length, 0);
  await duplicate.shutdown("test");
});

test("supervisor schedules bounded Bridge restart after abnormal exit", async () => {
  const scheduled = [];
  const spawned = [];
  let listener = false;
  const supervisor = createLocalRuntimeSupervisor({
    bridgePort: 18766,
    webPort: 13000,
    probePort: async (port) => port === 18766 ? listener : true,
    health: async () => true,
    webHealth: async () => true,
    spawnChild: (label, command, args) => { listener = true; const child = fakeChild(200 + spawned.length); spawned.push({ label, command, args, child }); return child; },
    logEvent: async () => {},
    schedule: (callback, delay) => { scheduled.push({ callback, delay }); },
  });
  await supervisor.ensureBridge();
  assert.equal(spawned.length, 1);
  listener = false;
  spawned[0].child.emit("exit", 1, null);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].delay, 250);
  scheduled[0].callback();
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(spawned.length, 2);
});

test("supervisor rejects a stale web listener instead of reporting ready", async () => {
  const supervisor = createLocalRuntimeSupervisor({
    bridgePort: 18766,
    webPort: 13000,
    probePort: async () => true,
    health: async () => true,
    webHealth: async () => false,
    spawnChild: () => { throw new Error("must not replace an unknown process"); },
    logEvent: async () => {},
  });
  await assert.rejects(supervisor.start(), /WEB_PORT_OCCUPIED_UNHEALTHY/);
});
