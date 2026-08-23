import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { promisify } from "node:util";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

const execFileAsync = promisify(execFile);

const root = new URL("../", import.meta.url);

async function readPanelFiles() {
  return Promise.all([
    readFile(new URL("app/waiting-video-panel.tsx", root), "utf8"),
    readFile(new URL("app/waiting-video-panel.module.css", root), "utf8"),
  ]);
}

test("renders only an accepted local pending/running Run", async () => {
  const [component] = await readPanelFiles();
  assert.match(component, /receiptAccepted\?: boolean/);
  assert.match(component, /runtime\?: "local" \| "public"/);
  assert.match(component, /WAITING_RUN_STATUSES = \["pending", "running"\]/);
  assert.match(component, /TERMINAL_RUN_STATUSES = \["completed", "error", "incomplete", "cancelled"\]/);
  assert.match(component, /shouldRenderWaitingVideoPanel/);
  assert.match(component, /if \(!panelOpen\) return null/);
  assert.match(component, /runtime === "public"/);
});

test("keeps the video node and playback position stable across polling updates", async () => {
  const [component] = await readPanelFiles();
  assert.match(component, /runKey = runId \?\? `legacy:/);
  assert.match(component, /\}, \[panelOpen, runKey\]\);/);
  assert.doesNotMatch(component, /\}, \[panelOpen, runKey, runStatus\]\);/);
  assert.match(component, /player\.currentTime = 0/);
  assert.match(component, /currentTime = 0[\s\S]*?\}, \[panelOpen, runKey\]\);/);
});

test("uses the required 16:9 controlled media contract", async () => {
  const [component, styles] = await readPanelFiles();
  assert.match(component, /controls/);
  assert.match(component, /playsInline/);
  assert.match(component, /loop/);
  assert.match(component, /preload="metadata"/);
  assert.match(styles, /aspect-ratio: 16 \/ 9/);
  assert.match(styles, /object-fit: contain/);
});

test("falls back from sound autoplay and offers an explicit sound/play action", async () => {
  const [component] = await readPanelFiles();
  assert.match(component, /await player\.play\(\)/);
  assert.match(component, /player\.muted = true/);
  assert.match(component, /setSoundPrompt\(true\)/);
  assert.match(component, /播放等待视频/);
  assert.match(component, /点击开启声音/);
});

test("keeps a user-closed Run closed and cleans media on teardown", async () => {
  const [component] = await readPanelFiles();
  assert.match(component, /closedRunKey/);
  assert.match(component, /setClosedRunKey\(runKey\)/);
  assert.match(component, /onClose\(\)/);
  assert.match(component, /player\.pause\(\)/);
  assert.match(component, /player\.removeAttribute\("src"\)/);
  assert.match(component, /player\.load\(\)/);
});

test("ships the active local-only waiting media with its provenance note", async () => {
  const [component, media480, mediaReadme, captions] = await Promise.all([
    readFile(new URL("app/waiting-video-panel.tsx", root), "utf8"),
    readFile(new URL("public/waiting-media/decade-all-riders-waiting-v1-480p.mp4", root)),
    readFile(new URL("public/waiting-media/README.md", root), "utf8"),
    readFile(new URL("public/waiting-media/waiting-v1.zh-Hans.vtt", root), "utf8"),
  ]);
  assert.match(component, /\/waiting-media\/decade-all-riders-waiting-v1-480p\.mp4/);
  assert.ok(media480.byteLength > 1_000_000, "480p waiting video asset is unexpectedly small");
  assert.match(component, /<track kind="captions"[^>]+waiting-v1\.zh-Hans\.vtt/);
  assert.match(captions, /^WEBVTT/);
  assert.match(mediaReadme, /仅供本地测试/);
  assert.match(mediaReadme, /bilibili\.com\/video\/BV1Cu4y1U7BT/);
});

test("480p media keeps the approved middle six minutes, H.264, AAC stereo, and faststart metadata", async () => {
  const mediaPath = new URL("public/waiting-media/decade-all-riders-waiting-v1-480p.mp4", root);
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height,channels",
    "-of", "json",
    mediaPath.pathname,
  ]);
  const metadata = JSON.parse(stdout);
  const video = metadata.streams.find((stream) => stream.codec_type === "video");
  const audio = metadata.streams.find((stream) => stream.codec_type === "audio");
  assert.deepEqual([video.codec_name, video.width, video.height], ["h264", 854, 480]);
  assert.deepEqual([audio.codec_name, audio.channels], ["aac", 2]);
  assert.ok(Math.abs(Number(metadata.format.duration) - 360) < 0.1, "480p duration drifted from the approved six-minute excerpt");

  const container = await readFile(mediaPath);
  const topLevelAtoms = [];
  for (let offset = 0; offset + 8 <= container.byteLength;) {
    let atomSize = container.readUInt32BE(offset);
    const atomType = container.toString("ascii", offset + 4, offset + 8);
    topLevelAtoms.push(atomType);
    if (atomSize === 1 && offset + 16 <= container.byteLength) atomSize = Number(container.readBigUInt64BE(offset + 8));
    if (atomSize === 0) break;
    assert.ok(atomSize >= 8, `invalid MP4 atom size for ${atomType}`);
    offset += atomSize;
  }
  const moovIndex = topLevelAtoms.indexOf("moov");
  const mdatIndex = topLevelAtoms.indexOf("mdat");
  assert.ok(moovIndex >= 0 && mdatIndex >= 0 && moovIndex < mdatIndex, "MP4 must keep the moov atom before mdat for faststart");
});

test("page mounts the waiting panel after receipt and closes it on terminal/error states", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /import \{ WaitingVideoPanel \} from "\.\/waiting-video-panel"/);
  assert.match(page, /setWaitingVideoOpen\(true\)[\s\S]*updateActivationHistory\(runId/);
  assert.match(page, /if \(!\["pending", "running"\]\.includes\(result\.status\)\) setWaitingVideoOpen\(false\)/);
  assert.match(page, /<WaitingVideoPanel[\s\S]*open=\{waitingVideoOpen\}[\s\S]*runStatus=\{naviRun\.status\}/);
  assert.doesNotMatch(page, /updateActivationHistory\(runId,[\s\S]{0,300}await openNaviRun\(runId\)/);
});

test("accepted pending Run renders the mounted video and caption track into DOM", async () => {
  const previousWindow = globalThis.window;
  globalThis.window = { location: { hostname: "localhost" } };
  const server = await createServer({
    configFile: false,
    root: new URL(".", root).pathname,
    plugins: [react()],
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent",
  });
  try {
    const { WaitingVideoPanel } = await server.ssrLoadModule("/app/waiting-video-panel.tsx");
    const html = renderToStaticMarkup(React.createElement(WaitingVideoPanel, {
      open: true,
      runId: "prun-dom-test",
      receiptAccepted: true,
      runStatus: "pending",
      runtime: "local",
      personaName: "测试人物",
      commandCode: "TEST",
      onMinimize() {},
      onClose() {},
    }));
    assert.match(html, /data-run-id="prun-dom-test"/);
    assert.match(html, /<video[^>]+src="\/waiting-media\/decade-all-riders-waiting-v1-480p\.mp4"/);
    assert.match(html, /<video[^>]+controls=""/);
    assert.match(html, /<track kind="captions" src="\/waiting-media\/waiting-v1\.zh-Hans\.vtt"/);
  } finally {
    await server.close();
    globalThis.window = previousWindow;
  }
});
