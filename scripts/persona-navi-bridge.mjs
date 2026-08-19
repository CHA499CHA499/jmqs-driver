import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PersonaNaviError,
  createPersonaRunService,
  inspectInstalledSkills,
  openYouNavi,
  resolveAgentCli,
} from "./persona-navi-bridge-lib.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(SCRIPT_DIR, "..");
const PORT = Number.parseInt(process.env.PERSONA_NAVI_BRIDGE_PORT || "8766", 10);
const RUN_ROOT = path.resolve(process.env.PERSONA_NAVI_RUN_ROOT || path.join(PROJECT_DIR, ".persona-runs"));
const SKILLS_DIR = path.resolve(process.env.PERSONA_NAVI_SKILLS_DIR || "/Users/zqnw/navi-ai/CHA499/skills");
const REQUEST_TOKEN = randomBytes(24).toString("base64url");
const TOKEN_HEADER = "x-persona-navi-token";
const ALLOWED_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
const service = createPersonaRunService({ runRoot: RUN_ROOT, skillsDir: SKILLS_DIR });

function requestOrigin(req) {
  return String(req.headers.origin || "").trim().toLowerCase();
}

function allowedHost(req) {
  const host = String(req.headers.host || "").trim().toLowerCase();
  return new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]).has(host);
}

function tokenMatches(actual) {
  const left = Buffer.from(String(actual || ""), "utf8");
  const right = Buffer.from(REQUEST_TOKEN, "utf8");
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

function assertBrowserRequest(req, { token = true } = {}) {
  if (!allowedHost(req)) throw new PersonaNaviError("请求 Host 不是本机 Bridge", { code: "INVALID_LOCAL_HOST", status: 403 });
  const origin = requestOrigin(req);
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    throw new PersonaNaviError("页面来源不在 Bridge 白名单", { code: "INVALID_REQUEST_ORIGIN", status: 403 });
  }
  const fetchSite = String(req.headers["sec-fetch-site"] || "").trim().toLowerCase();
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    throw new PersonaNaviError("拒绝跨站调用本机 Bridge", { code: "CROSS_SITE_REQUEST", status: 403 });
  }
  if (token && !tokenMatches(req.headers[TOKEN_HEADER])) {
    throw new PersonaNaviError("Bridge 会话令牌无效", { code: "INVALID_REQUEST_TOKEN", status: 403 });
  }
}

function corsHeaders(req) {
  const origin = requestOrigin(req);
  return ALLOWED_ORIGINS.has(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": `content-type,${TOKEN_HEADER}`,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        Vary: "Origin",
      }
    : {};
}

function sendJson(req, res, status, value) {
  const body = `${JSON.stringify(value)}\n`;
  res.writeHead(status, {
    ...corsHeaders(req),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Cross-Origin-Resource-Policy": "same-site",
  });
  res.end(body);
}

async function readJsonBody(req, limit = 256 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new PersonaNaviError("请求体超过 256KB", { code: "REQUEST_TOO_LARGE", status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new PersonaNaviError("请求体不是有效 JSON", { code: "INVALID_JSON" });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      assertBrowserRequest(req, { token: false });
      res.writeHead(204, corsHeaders(req));
      res.end();
      return;
    }
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    if (url.pathname === "/health" && req.method === "GET") {
      assertBrowserRequest(req, { token: false });
      const [skills, cli] = await Promise.all([
        inspectInstalledSkills(SKILLS_DIR),
        resolveAgentCli().then(() => true).catch(() => false),
      ]);
      sendJson(req, res, 200, {
        ok: true,
        service: "persona-navi-bridge",
        token: REQUEST_TOKEN,
        cliAvailable: cli,
        skills,
      });
      return;
    }
    if (url.pathname === "/runs" && req.method === "POST") {
      assertBrowserRequest(req);
      sendJson(req, res, 200, await service.createRun(await readJsonBody(req)));
      return;
    }
    const runMatch = url.pathname.match(/^\/runs\/(prun-[a-z0-9-]{12,72})$/i);
    if (runMatch && req.method === "GET") {
      assertBrowserRequest(req);
      sendJson(req, res, 200, await service.readRun(runMatch[1]));
      return;
    }
    const openMatch = url.pathname.match(/^\/runs\/(prun-[a-z0-9-]{12,72})\/open$/i);
    if (openMatch && req.method === "POST") {
      assertBrowserRequest(req);
      sendJson(req, res, 200, await openYouNavi());
      return;
    }
    sendJson(req, res, 404, { ok: false, code: "NOT_FOUND", error: "Route not found" });
  } catch (error) {
    const known = error instanceof PersonaNaviError;
    sendJson(req, res, known ? error.status : 500, {
      ok: false,
      code: known ? error.code : "PERSONA_NAVI_INTERNAL",
      error: String(error?.message || "Persona Navi Bridge 失败").slice(0, 1200),
    });
  }
});

server.listen(PORT, "localhost", () => {
  process.stdout.write(`Persona Navi Bridge: http://localhost:${PORT}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
