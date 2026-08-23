import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("maps the five Persona motions to the approved resources", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const approved = [
    "/personas-motion/naval.mp4",
    "/personas-motion/elon-musk.mp4",
    "/personas-motion-v3-intense/steve-jobs-action-masked-intense-v3.mp4",
    "/personas-motion-v3-intense/donald-trump-action-masked-intense-v3.mp4",
    "/personas-motion-v3-intense/paul-graham-action-masked-intense-v3.mp4",
  ];
  for (const asset of approved) assert.ok(page.includes(`motion: "${asset}"`), `missing motion mapping: ${asset}`);
  assert.doesNotMatch(page, /personas-motion-v3-intense\/(naval|elon-musk)-action-masked-intense-v3\.mp4/);
  const files = await Promise.all(approved.map((asset) => readFile(new URL(`public${asset}`, root))));
  for (const file of files) assert.ok(file.byteLength > 1_000_000);
});

test("reveals any selected pack card through real video with static fallbacks", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /function revealPackCard\(personaId: string\)/);
  assert.doesNotMatch(page, /nextPackPersona|isNext|等待前一张/);
  assert.match(page, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/);
  assert.match(page, /finishPackReveal\(personaId\)/);
  assert.match(page, /setRevealedPackIds/);
  assert.match(page, /setViewedEntranceIds/);
  assert.match(page, /className="pack-entrance-video"/);
  assert.match(page, /autoPlay muted playsInline preload="auto"/);
  assert.match(page, /onEnded=\{\(\) => finishPackReveal/);
  assert.match(page, /onError=\{\(\) => finishPackReveal/);
  assert.match(page, />跳过动画<\/button>/);
  assert.match(page, /if \(progress\.packOpened\) setScreen\("deal-cards"\)/);
  assert.doesNotMatch(page, /setRevealedPackIds\(PERSONAS\.map/);
  assert.match(page, /aria-label=\{revealed \? `重播\$\{persona\.name\}角色动画` : `翻开\$\{persona\.name\}`\}/);
  assert.doesNotMatch(page, /disabled=\{revealed|disabled=\{.*packEntrancePersonaId/);
});

test("skips all remaining pack animations and persists the completed five-card state", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /function revealAllPackCards\(\)/);
  assert.match(page, /packEntranceVideoRef\.current/);
  assert.match(page, /video\.pause\(\)/);
  assert.match(page, /video\.currentTime = 0/);
  assert.match(page, /stopPackEntrancePreset\(\)/);
  assert.match(page, /const allPersonaIds = PERSONAS\.map\(\(persona\) => persona\.id\)/);
  assert.match(page, /setRevealedPackIds\(allPersonaIds\)/);
  assert.match(page, /setViewedEntranceIds\(allPersonaIds\)/);
  assert.match(page, /className="pack-skip-all"/);
  assert.match(page, /className="pack-entrance-skip" type="button" onClick=\{revealAllPackCards\}/);
  assert.match(page, /if \(progress\.packOpened\) setScreen\("deal-cards"\)/);
});

test("keeps the pack heading and helper copy single-line without an eyebrow", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  assert.doesNotMatch(page, /DEALING PERSONA CARDS/);
  assert.match(page, /点击任意卡牌翻开/);
  assert.match(page, /任选卡牌观看角色动画/);
  assert.match(css, /\.pack-reveal-copy h1[\s\S]*white-space: nowrap/);
  assert.match(css, /\.pack-reveal-copy p[\s\S]*white-space: nowrap/);
  assert.match(css, /\.pack-skip-all[\s\S]*position: absolute[\s\S]*right: 0[\s\S]*bottom: 26px/);
});

test("keeps Driver activation motion disabled while preserving static activation and Navi", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  assert.match(page, /const DRIVER_ACTIVATION_MOTION_ENABLED = false/);
  assert.match(page, /function activateDriver\(\)[\s\S]*setPhase\("activated"\)[\s\S]*startNaviConversation/);
  assert.doesNotMatch(page, /triggerActivationMotion/);
  assert.match(page, /activationStartedRef\.current/);
  assert.match(page, /playActivationSequence/);
  assert.match(page, /DRIVER_ACTIVATION_MOTION_ENABLED && phase === "activated" && activationMotionPersona/);
  assert.match(page, /DRIVER_ACTIVATION_MOTION_ENABLED && activationMotionDiagnostic/);
  assert.match(page, /ref=\{activationVideoRef\}/);
  assert.match(page, /onLoadedData=\{\(\) => void playActivationMotionVideo\(\)\}/);
  assert.match(css, /\.driver-activation-motion[\s\S]*position: absolute/);
  assert.match(css, /\.driver-activation-video[\s\S]*object-fit: contain/);
});
