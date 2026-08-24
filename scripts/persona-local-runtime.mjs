import { appendFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN_ROOT = path.resolve(process.env.PERSONA_NAVI_RUN_ROOT || path.join(PROJECT_DIR, ".persona-runs"));
const LOG_FILE = path.join(RUN_ROOT, "bridge-events.ndjson");
const BRIDGE_PORT = Number(process.env.PERSONA_NAVI_BRIDGE_PORT || 8766);
const WEB_PORT = Number(process.env.PORT || 3000);
const MAX_RESTARTS = 3;
const BRIDGE_READY_TIMEOUT_MS = 30_000;

async function defaultLogEvent(event, extra = {}) {
  await mkdir(RUN_ROOT, { recursive: true });
  await appendFile(LOG_FILE, `${JSON.stringify({ ts: new Date().toISOString(), pid: process.pid, event, ...extra })}\n`);
}

export function probe(port, host = "127.0.0.1", timeout = 300) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    const finish = (value) => { socket.destroy(); resolve(value); };
    socket.setTimeout(timeout, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function defaultHealth(port) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { cache: "no-store", signal: controller.signal });
    const body = await response.json().catch(() => null);
    return response.ok && body?.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function defaultWebHealth(port) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);
  try {
    const response = await fetch(`http://localhost:${port}/`, { cache: "no-store", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function defaultSpawnChild(label, command, args) {
  const child = spawn(command, args, { cwd: PROJECT_DIR, env: process.env, stdio: ["inherit", "pipe", "pipe"] });
  child.stdout.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));
  return child;
}

export function createLocalRuntimeSupervisor({
  bridgePort = BRIDGE_PORT,
  webPort = WEB_PORT,
  maxRestarts = MAX_RESTARTS,
  readyTimeoutMs = BRIDGE_READY_TIMEOUT_MS,
  probePort = probe,
  health = defaultHealth,
  webHealth = defaultWebHealth,
  spawnChild = defaultSpawnChild,
  logEvent = defaultLogEvent,
  write = (value) => process.stdout.write(value),
  schedule = (callback, delay) => setTimeout(callback, delay),
} = {}) {
  const children = new Map();
  let bridgeRestarts = 0;
  let shuttingDown = false;

  async function waitForBridgeReady() {
    const deadline = Date.now() + readyTimeoutMs;
    while (Date.now() < deadline) {
      if (await health(bridgePort)) return true;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Persona Bridge 未通过 health ready：127.0.0.1:${bridgePort}`);
  }

  async function waitForWebReady() {
    const deadline = Date.now() + readyTimeoutMs;
    while (Date.now() < deadline) {
      if (await webHealth(webPort)) return true;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Persona Web 未通过 HTTP ready：localhost:${webPort}`);
  }

  async function restartBridge() {
    if (shuttingDown || bridgeRestarts >= maxRestarts) {
      if (!shuttingDown) await logEvent("error", { code: "BRIDGE_RESTART_LIMIT", port: bridgePort });
      return;
    }
    const delay = 250 * (2 ** bridgeRestarts);
    bridgeRestarts += 1;
    await logEvent("restart", { code: "BRIDGE_RESTART_SCHEDULED", attempt: bridgeRestarts, delayMs: delay, port: bridgePort });
    schedule(() => { void ensureBridge().catch((error) => logEvent("error", { code: "BRIDGE_READY_FAILED", error: String(error?.message || error).slice(0, 240) })); }, delay);
  }

  async function ensureBridge() {
    if (await probePort(bridgePort)) {
      await waitForBridgeReady();
      await logEvent("startup", { code: "BRIDGE_ALREADY_LISTENING", port: bridgePort });
      return;
    }
    const child = spawnChild("bridge", process.execPath, ["scripts/persona-navi-bridge.mjs"]);
    children.set("bridge", child);
    await logEvent("startup", { code: "BRIDGE_START", childPid: child.pid, port: bridgePort });
    child.once("exit", async (code, signal) => {
      children.delete("bridge");
      await logEvent(shuttingDown ? "shutdown" : "restart", { code: "BRIDGE_EXIT", childPid: child.pid, exitCode: code, signal });
      await restartBridge();
    });
    await waitForBridgeReady();
    await logEvent("listening", { code: "BRIDGE_READY", childPid: child.pid, port: bridgePort });
  }

  async function ensureWeb() {
    if (await probePort(webPort)) {
      if (!await webHealth(webPort)) throw new Error(`WEB_PORT_OCCUPIED_UNHEALTHY：localhost:${webPort}`);
      await logEvent("startup", { code: "WEB_ALREADY_LISTENING", port: webPort });
      return;
    }
    const child = spawnChild("web", "npm", ["run", "dev:web", "--", "--port", String(webPort)]);
    children.set("web", child);
    await logEvent("startup", { code: "WEB_START", childPid: child.pid, port: webPort });
    child.once("exit", async (code, signal) => {
      children.delete("web");
      await logEvent("shutdown", { code: "WEB_EXIT", childPid: child.pid, exitCode: code, signal });
    });
    await waitForWebReady();
    await logEvent("listening", { code: "WEB_READY", childPid: child.pid, port: webPort });
  }

  async function start() {
    await logEvent("startup", { code: "SUPERVISOR_START", webPort, bridgePort });
    await Promise.all([ensureBridge(), ensureWeb()]);
    write(`Persona local runtime ready: web :${webPort}, bridge :${bridgePort}\n`);
    await logEvent("listening", { code: "SUPERVISOR_READY", webPort, bridgePort });
  }

  async function shutdown(signal = "SIGTERM") {
    if (shuttingDown) return;
    shuttingDown = true;
    await logEvent("shutdown", { code: "SUPERVISOR_STOP", signal });
    for (const child of children.values()) child.kill("SIGTERM");
    children.clear();
  }

  return { start, shutdown, ensureBridge, ensureWeb, children };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const supervisor = createLocalRuntimeSupervisor();
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => void supervisor.shutdown(signal).finally(() => process.exit(0)));
  await supervisor.start();
}
