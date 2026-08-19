import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the public persona atlas shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>假面骑事 \| 公开测试版<\/title>/);
  assert.match(html, /src="\/persona-atlas\.html"/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview/);
});

test("ships the interactive demo asset", async () => {
  const html = await readFile(new URL("../public/persona-atlas.html", import.meta.url), "utf8");
  assert.match(html, /feishu-persona-atlas/);
  assert.match(html, /开始构建图鉴/);
  assert.match(html, /假面骑事/);
  assert.doesNotMatch(html, /真实飞书数据/);
});
