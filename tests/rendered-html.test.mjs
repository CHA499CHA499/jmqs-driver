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
  assert.match(html, /<title>假面骑事 \| Persona Driver 工作台<\/title>/);
  assert.match(html, /PERSONA DRIVER WORKBENCH/);
  assert.match(html, /原始素材/);
  assert.match(html, /角色实例/);
  assert.doesNotMatch(html, /public-demo-frame/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview/);
});

test("ships the interactive demo asset", async () => {
  const html = await readFile(new URL("../public/persona-atlas.html", import.meta.url), "utf8");
  assert.match(html, /feishu-persona-atlas/);
  assert.match(html, /开始构建图鉴/);
  assert.match(html, /假面骑事/);
  assert.match(html, /hero-personas\.png/);
  assert.match(html, /纳瓦尔/);
  assert.match(html, /埃隆·马斯克/);
  assert.match(html, /史蒂夫·乔布斯/);
  assert.match(html, /唐纳德·特朗普/);
  assert.match(html, /Paul Graham/);
  assert.match(html, /恢复 5 张固定卡/);
  assert.match(html, /打开卡包/);
  assert.match(html, /构建卡片/);
  assert.match(html, /data-screen="choice"/);
  assert.match(html, /data-view="pack"/);
  assert.match(html, /点击卡牌逐张揭晓/);
  assert.match(html, /收下卡牌/);
  assert.match(html, /personas\/naval\.jpg/);
  assert.match(html, /personas\/elon-musk\.jpg/);
  assert.match(html, /personas\/steve-jobs\.jpg/);
  assert.match(html, /personas\/donald-trump\.jpg/);
  assert.match(html, /personas\/paul-graham\.jpg/);
  assert.match(html, /不代表本人观点/);
  assert.doesNotMatch(html, /楚云|林岳|周奕|顾遥|沈玥|唐骁|叶澄|许棠/);
  assert.match(html, /min-height:100dvh/);
  assert.doesNotMatch(html, /min-height:\s*(720|760|780)px/);
  assert.doesNotMatch(html, /真实飞书数据/);
});

test("ships five generated persona illustrations", async () => {
  const assets = await Promise.all([
    readFile(new URL("../public/personas/naval.jpg", import.meta.url)),
    readFile(new URL("../public/personas/elon-musk.jpg", import.meta.url)),
    readFile(new URL("../public/personas/steve-jobs.jpg", import.meta.url)),
    readFile(new URL("../public/personas/donald-trump.jpg", import.meta.url)),
    readFile(new URL("../public/personas/paul-graham.jpg", import.meta.url)),
  ]);
  for (const asset of assets) assert.ok(asset.byteLength > 100_000);
});

test("includes the isolated Three.js driver and original audio layer", async () => {
  const [driver, driverAudio, page, packageJson] = await Promise.all([
    readFile(new URL("../app/driver-scene.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/driver-audio.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(packageJson, /"three"/);
  assert.match(driver, /WebGLRenderer/);
  assert.match(driver, /getContext\("webgl2"\)/);
  assert.match(driver, /requestAnimationFrame/);
  assert.match(driver, /renderer\.dispose\(\)/);
  assert.match(driverAudio, /PERSONA RIDE/);
  assert.match(driverAudio, /speechSynthesis/);
  assert.match(driverAudio, /createOscillator/);
  assert.match(driverAudio, /createBuffer/);
  assert.match(page, /playActivationSequence/);
});
