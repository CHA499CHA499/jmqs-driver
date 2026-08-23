import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("keeps Persona Driver rods inside the vertical cavities", async () => {
  const [scene, closure, styles] = await Promise.all([
    readFile(new URL("app/driver-texture-scene.tsx", root), "utf8"),
    readFile(new URL("app/driver-closure-layer.tsx", root), "utf8"),
    readFile(new URL("app/driver-closure-layer.module.css", root), "utf8"),
  ]);

  assert.match(scene, /DriverClosureLayer/);
  assert.match(closure, /data-layer="center-core"/);
  assert.match(closure, /SideChassisAssembly/);
  assert.match(closure, /data-layer=\{`\$\{side\}-side-assembly`\}/);
  assert.match(closure, /data-slot-window=\{side\}/);
  assert.match(closure, /data-rod-viewport=\{side\}/);
  assert.match(closure, /\{equipped && \(/);
  assert.match(closure, /data-payload-state="charged"/);
  assert.doesNotMatch(closure, /payloadsVisible|rodAssets\.energy\.empty|rodAssets\.skill\.empty/);
  assert.doesNotMatch(closure, /phase === "locked" \|\| phase === "activated"/);
  assert.match(closure, /rodAssets\.skill\.charged/);
  assert.match(styles, /--driver-slot-left: 27\.55%/);
  assert.match(styles, /--driver-slot-right: 72\.45%/);
  assert.match(styles, /--driver-slot-window-width: 6\.76%/);
  assert.match(styles, /--driver-slot-window-height: 52\.2%/);
  assert.match(styles, /One transform owner per side/);
  assert.match(styles, /\.rodSprite \{/);
  assert.match(styles, /height: var\(--driver-rod-fill\)/);
  assert.match(styles, /width: 100%/);
  assert.match(styles, /\.rodViewport \{/);
  assert.match(styles, /overflow: hidden/);
  assert.match(styles, /transform: translateY\(-100%\)/);
  assert.match(styles, /transform: translateY\(0\)/);
  assert.doesNotMatch(styles, /\.rodSprite[\s\S]*aspect-ratio/);
  assert.match(styles, /@keyframes side-rod-insert/);
  assert.doesNotMatch(styles, /opacity: \.05/);
  assert.doesNotMatch(styles, /payload-insert|leftPayloadMotion|rightPayloadMotion|leftFrontMask|rightFrontMask/);
  assert.match(styles, /texture-driver-foreground/);
  assert.match(closure, /left-slot-foreground-v2\.png/);
  assert.match(closure, /right-slot-foreground-v2\.png/);
});

test("uses the charged energy rod only after equipped and keeps loose states distinct", async () => {
  const [scene, page, css, empty, charged] = await Promise.all([
    readFile(new URL("app/driver-texture-scene.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("public/driver-textures/energy-rod-empty-v1.png", root)),
    readFile(new URL("public/driver-textures/energy-rod-charged-v1.png", root)),
  ]);

  assert.match(scene, /charged: "\/driver-textures\/energy-rod-charged-tight-v1\.png"/);
  assert.match(page, /energy-rod-charged-v1\.png/);
  assert.match(css, /\.driver-rod-card\.energy:not\(\.is-charged\) \.driver-rod-visual i/);
  assert.ok(empty.byteLength > 1_000_000, "empty energy rod asset is unexpectedly small");
  assert.ok(charged.byteLength > 1_000_000, "charged energy rod asset is unexpectedly small");
});

test("enforces the canonical rod canvas and alpha bbox contract", async () => {
  const paths = [
    "public/driver-textures/energy-rod-canonical-v1.png",
    "public/driver-textures/energy-rod-empty-canonical-v1.png",
    "public/driver-textures/energy-rod-charged-canonical-v1.png",
    "public/driver-textures/skill-rod-canonical-v1.png",
    "public/driver-textures/skill-rod-charged-canonical-v1.png",
    "public/driver-textures/energy-rod-tight-v1.png",
    "public/driver-textures/energy-rod-empty-tight-v1.png",
    "public/driver-textures/energy-rod-charged-tight-v1.png",
    "public/driver-textures/skill-rod-tight-v1.png",
    "public/driver-textures/skill-rod-charged-tight-v1.png",
    "public/driver-textures/energy-rod-tight-v1.png",
    "public/driver-textures/energy-rod-empty-tight-v1.png",
    "public/driver-textures/energy-rod-charged-tight-v1.png",
    "public/driver-textures/skill-rod-tight-v1.png",
    "public/driver-textures/skill-rod-charged-tight-v1.png",
  ];
  for (const path of paths) {
    const { data, info } = await sharp(await readFile(new URL(path, root))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const isTight = path.includes("-tight-");
    assert.deepEqual([info.width, info.height], isTight ? [256, 1500] : [1024, 1536], `${path} canvas drifted`);
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        if (data[(y * info.width + x) * info.channels + 3] === 0) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    assert.deepEqual([minX, minY, maxX + 1, maxY + 1], isTight ? [0, 0, 256, 1500] : [384, 18, 640, 1518], `${path} alpha bbox drifted`);
  }
});

test("moves complete side chassis modules while keeping the core/card fixed", async () => {
  const [scene, closure, styles] = await Promise.all([
    readFile(new URL("app/driver-texture-scene.tsx", root), "utf8"),
    readFile(new URL("app/driver-closure-layer.tsx", root), "utf8"),
    readFile(new URL("app/driver-closure-layer.module.css", root), "utf8"),
  ]);

  assert.match(scene, /data-closure-state=\{closureState\}/);
  assert.match(styles, /--chassis-shift: 10\.5%/);
  assert.match(closure, /data-layer=\{`\$\{side\}-payload`\}/);
  assert.match(styles, /\.leftSideAssembly[\s\S]*translateX\(calc\(var\(--driver-close\) \* var\(--chassis-shift\)\)/);
  assert.match(styles, /\.rightSideAssembly[\s\S]*translateX\(calc\(var\(--driver-close\) \* var\(--chassis-shift\) \* -1\)/);
  assert.match(styles, /@keyframes side-assembly-left-snap/);
  assert.match(styles, /@keyframes side-assembly-right-snap/);
  assert.match(styles, /@keyframes snap-lock/);
  assert.match(styles, /@keyframes snap-flash/);
  assert.match(styles, /\.sideAssembly \{/);
  assert.match(styles, /\.slotWindow \{/);
  assert.match(styles, /\.slotForegroundMask \{/);
  assert.doesNotMatch(closure, /payloadMotion|frontMaskMotion|leftPayloadMotion|rightPayloadMotion|leftFrontMask|rightFrontMask/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(styles, /clampArm|lockStop|energyClamp|skillClamp/);
  assert.doesNotMatch(styles, /:global\(\.driver-assembly\)[^{]*\{[^}]*transform/);
  assert.match(styles, /translate\(-50%, -50%\)/);
});

test("ships the runtime v2 assembly layers and canonical rod sources", async () => {
  const assets = [
    "public/driver-textures/assembly/center-core-v2.png",
    "public/driver-textures/assembly/left-chassis-v2.png",
    "public/driver-textures/assembly/right-chassis-v2.png",
    "public/driver-textures/assembly/foreground-masks-v2.png",
    "public/driver-textures/assembly/left-slot-foreground-v2.png",
    "public/driver-textures/assembly/right-slot-foreground-v2.png",
    "public/driver-textures/energy-rod-canonical-v1.png",
    "public/driver-textures/energy-rod-empty-canonical-v1.png",
    "public/driver-textures/energy-rod-charged-canonical-v1.png",
    "public/driver-textures/skill-rod-canonical-v1.png",
    "public/driver-textures/skill-rod-charged-canonical-v1.png",
  ];
  const files = await Promise.all(assets.map((asset) => readFile(new URL(asset, root))));
  for (const file of files) assert.ok(file.byteLength > 1_000, "runtime assembly asset is unexpectedly empty");
});
