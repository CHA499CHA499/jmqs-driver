"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type DriverPhase = "idle" | "ready" | "inserting" | "locked" | "activated";

interface DriverSceneProps {
  phase: DriverPhase;
  cardColor: string;
  handleProgress: number;
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

export function DriverScene({ phase, cardColor, handleProgress }: DriverSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<DriverPhase>(phase);
  const handleProgressRef = useRef(handleProgress);
  const phaseStartedRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
    phaseStartedRef.current = performance.now();
  }, [phase]);

  useEffect(() => {
    handleProgressRef.current = handleProgress;
  }, [handleProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const capabilityCanvas = document.createElement("canvas");
    if (!capabilityCanvas.getContext("webgl2")) {
      const failureFrame = window.requestAnimationFrame(() => setFailed(true));
      return () => window.cancelAnimationFrame(failureFrame);
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      const failureFrame = window.requestAnimationFrame(() => setFailed(true));
      return () => window.cancelAnimationFrame(failureFrame);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x07090d, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.25, 7.4);

    const driver = new THREE.Group();
    scene.add(driver);

    const modelAssembly = new THREE.Group();
    modelAssembly.visible = false;
    scene.add(modelAssembly);
    let modelCard: THREE.Group | null = null;
    let energyRod: THREE.Group | null = null;
    let skillRod: THREE.Group | null = null;
    let leftDockPivot: THREE.Object3D | null = null;
    let rightDockPivot: THREE.Object3D | null = null;
    const modelSignalMaterials = new Set<THREE.MeshStandardMaterial>();
    const cardSignalMaterials = new Set<THREE.MeshStandardMaterial>();
    let disposed = false;

    const metal = new THREE.MeshStandardMaterial({ color: 0x343942, metalness: 0.9, roughness: 0.28 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x11151b, metalness: 0.82, roughness: 0.38 });
    const silver = new THREE.MeshStandardMaterial({ color: 0xaeb4bd, metalness: 0.96, roughness: 0.2 });
    const energy = new THREE.MeshStandardMaterial({
      color: 0x71111f,
      emissive: 0xef3048,
      emissiveIntensity: 0.35,
      metalness: 0.45,
      roughness: 0.28,
    });

    const backPlate = new THREE.Mesh(new THREE.CylinderGeometry(2.34, 2.34, 0.34, 12), darkMetal);
    backPlate.rotation.x = Math.PI / 2;
    backPlate.position.z = -0.34;
    driver.add(backPlate);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.2, 16, 72), metal);
    const middleRing = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.09, 12, 72), silver);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.1, 12, 64), energy);
    outerRing.position.z = 0.05;
    middleRing.position.z = 0.22;
    innerRing.position.z = 0.34;
    driver.add(outerRing, middleRing, innerRing);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.3, 8), energy);
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.34;
    driver.add(core);

    const coreInset = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 8), darkMetal);
    coreInset.rotation.x = Math.PI / 2;
    coreInset.position.z = 0.52;
    driver.add(coreInset);

    const leftHousing = new THREE.Mesh(new THREE.BoxGeometry(1.02, 2.95, 0.46), metal);
    const rightHousing = leftHousing.clone();
    leftHousing.position.set(-2.15, -0.05, -0.03);
    rightHousing.position.set(2.15, -0.05, -0.03);
    leftHousing.rotation.z = -0.2;
    rightHousing.rotation.z = 0.2;
    driver.add(leftHousing, rightHousing);

    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.26, 0.58), energy);
    const rightRail = leftRail.clone();
    leftRail.position.set(-1.72, -0.16, 0.16);
    rightRail.position.set(1.72, -0.16, 0.16);
    leftRail.rotation.z = -0.2;
    rightRail.rotation.z = 0.2;
    driver.add(leftRail, rightRail);

    const slotFrame = new THREE.Mesh(new THREE.BoxGeometry(0.94, 1.62, 0.22), silver);
    slotFrame.position.set(0, -0.52, 0.78);
    driver.add(slotFrame);
    const slotVoid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.4, 0.28), new THREE.MeshBasicMaterial({ color: 0x050608 }));
    slotVoid.position.set(0, -0.5, 0.91);
    driver.add(slotVoid);

    const cardMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(cardColor), metalness: 0.35, roughness: 0.4 });
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.04, 0.07), cardMaterial);
    card.position.set(0, 3.25, 1.08);
    card.visible = false;
    driver.add(card);

    const energyBars: THREE.Mesh[] = [];
    for (let index = 0; index < 8; index += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.08), energy);
      const angle = (index / 8) * Math.PI * 2;
      bar.position.set(Math.cos(angle) * 1.22, Math.sin(angle) * 1.22, 0.58);
      bar.rotation.z = angle;
      driver.add(bar);
      energyBars.push(bar);
    }

    function collectMaterials(root: THREE.Object3D, cardOnly = false) {
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!(material instanceof THREE.MeshStandardMaterial)) return;
          if (material.name.includes("SignalRed")) {
            modelSignalMaterials.add(material);
            if (cardOnly) cardSignalMaterials.add(material);
          }
        });
      });
    }

    function disposeDetached(root: THREE.Object3D) {
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    }

    const modelLoader = new GLTFLoader();
    void Promise.all([
      modelLoader.loadAsync("/models/persona-driver/belt.glb"),
      modelLoader.loadAsync("/models/persona-driver/persona-card.glb"),
      modelLoader.loadAsync("/models/persona-driver/energy-rod.glb"),
      modelLoader.loadAsync("/models/persona-driver/skill-rod.glb"),
    ]).then(([beltAsset, cardAsset, energyAsset, skillAsset]) => {
      if (disposed) {
        [beltAsset.scene, cardAsset.scene, energyAsset.scene, skillAsset.scene].forEach(disposeDetached);
        return;
      }

      const beltModel = beltAsset.scene;
      modelCard = cardAsset.scene;
      energyRod = energyAsset.scene;
      skillRod = skillAsset.scene;
      leftDockPivot = beltModel.getObjectByName("LeftRodDock_Pivot") ?? null;
      rightDockPivot = beltModel.getObjectByName("RightRodDock_Pivot") ?? null;

      modelCard.position.set(0, 0.04, 1.48);
      energyRod.position.set(-1.03, 0.02, 1.48);
      skillRod.position.set(1.03, 0.02, 1.48);
      energyRod.rotation.z = 0.23;
      skillRod.rotation.z = -0.23;

      collectMaterials(beltModel);
      collectMaterials(modelCard, true);
      collectMaterials(energyRod);
      collectMaterials(skillRod);
      modelAssembly.add(beltModel, modelCard, energyRod, skillRod);
      modelAssembly.scale.setScalar(1.08);
      modelAssembly.position.y = -0.02;
      modelAssembly.visible = true;
      driver.visible = false;
    }).catch(() => {
      modelAssembly.visible = false;
      driver.visible = true;
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const keyLight = new THREE.DirectionalLight(0xdce7ff, 4.1);
    keyLight.position.set(-3, 4, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffd5d9, 2.2);
    rimLight.position.set(4, -1, 4);
    scene.add(rimLight);
    const redLight = new THREE.PointLight(0xef3048, 1.4, 8, 2);
    redLight.position.set(0, 0, 3.1);
    scene.add(redLight);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let lastRendered = 0;
    let resizeFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    function resizeNow() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function scheduleResize() {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resizeNow();
      });
    }

    const observer = new ResizeObserver(scheduleResize);
    observer.observe(container);
    scheduleResize();

    function handlePointerMove(event: PointerEvent) {
      const rect = container.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    function handlePointerLeave() {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    }
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    function animate(time: number) {
      frame = window.requestAnimationFrame(animate);
      if (document.hidden || time - lastRendered < 30) return;
      lastRendered = time;

      const currentPhase = phaseRef.current;
      const elapsed = Math.max(0, time - phaseStartedRef.current);
      const active = currentPhase === "activated";
      const armed = currentPhase === "ready" || currentPhase === "inserting" || currentPhase === "locked" || active;
      const closure = active ? 1 : currentPhase === "locked" ? handleProgressRef.current : 0;
      const assembly = easeOutCubic(closure);

      leftHousing.position.x = THREE.MathUtils.lerp(-2.62, -2.15, assembly);
      rightHousing.position.x = THREE.MathUtils.lerp(2.62, 2.15, assembly);
      leftHousing.rotation.z = THREE.MathUtils.lerp(-0.34, -0.2, assembly);
      rightHousing.rotation.z = THREE.MathUtils.lerp(0.34, 0.2, assembly);
      leftRail.position.x = THREE.MathUtils.lerp(-2.04, -1.72, assembly);
      rightRail.position.x = THREE.MathUtils.lerp(2.04, 1.72, assembly);
      leftRail.rotation.z = THREE.MathUtils.lerp(-0.34, -0.2, assembly);
      rightRail.rotation.z = THREE.MathUtils.lerp(0.34, 0.2, assembly);
      outerRing.position.z = THREE.MathUtils.lerp(-0.28, 0.05, assembly);
      middleRing.position.z = THREE.MathUtils.lerp(-0.02, 0.22, assembly);
      innerRing.position.z = THREE.MathUtils.lerp(0.14, 0.34, assembly);
      core.position.z = THREE.MathUtils.lerp(0.12, 0.34, assembly);
      coreInset.position.z = THREE.MathUtils.lerp(0.25, 0.52, assembly);
      const breath = reducedMotion ? 1 : 1 + Math.sin(time * 0.0018) * 0.025;
      core.scale.setScalar(breath);
      coreInset.rotation.z = active ? time * -0.003 : time * -0.00028;
      outerRing.rotation.z = active ? time * 0.0017 : time * 0.00008;
      middleRing.rotation.z = active ? time * -0.0024 : -time * 0.00012;
      innerRing.rotation.z = active ? time * 0.0033 : time * 0.00018;

      const targetX = reducedMotion ? 0 : pointerRef.current.y * 0.04;
      const targetY = reducedMotion ? 0 : pointerRef.current.x * 0.08;
      driver.rotation.x += (targetX - driver.rotation.x) * 0.06;
      driver.rotation.y += (targetY - driver.rotation.y) * 0.06;
      modelAssembly.rotation.x += (targetX - modelAssembly.rotation.x) * 0.06;
      modelAssembly.rotation.y += (targetY - modelAssembly.rotation.y) * 0.06;

      card.visible = currentPhase === "inserting" || currentPhase === "locked" || active;
      cardMaterial.color.set(cardColor);
      if (currentPhase === "inserting") {
        const progress = Math.min(1, elapsed / (reducedMotion ? 1 : 900));
        card.position.y = THREE.MathUtils.lerp(3.25, -0.48, easeOutCubic(progress));
        card.rotation.z = THREE.MathUtils.lerp(-0.08, 0, progress);
      } else if (card.visible) {
        card.position.y = -0.48;
        card.rotation.z = 0;
      } else {
        card.position.y = 3.25;
      }

      if (modelCard) {
        modelCard.visible = card.visible;
        if (currentPhase === "inserting") {
          const progress = Math.min(1, elapsed / (reducedMotion ? 1 : 900));
          modelCard.position.y = THREE.MathUtils.lerp(2.65, 0.04, easeOutCubic(progress));
          modelCard.rotation.z = THREE.MathUtils.lerp(-0.08, 0, progress);
        } else if (modelCard.visible) {
          modelCard.position.y = 0.04;
          modelCard.rotation.z = 0;
        } else {
          modelCard.position.y = 2.65;
        }
        cardSignalMaterials.forEach((material) => {
          material.color.set(cardColor);
          material.emissive.set(cardColor);
        });
      }

      if (energyRod && skillRod) {
        energyRod.position.x = THREE.MathUtils.lerp(-1.03, -0.92, assembly);
        skillRod.position.x = THREE.MathUtils.lerp(1.03, 0.92, assembly);
        energyRod.rotation.z = THREE.MathUtils.lerp(0.23, 0.055, assembly);
        skillRod.rotation.z = THREE.MathUtils.lerp(-0.23, -0.055, assembly);
      }
      if (leftDockPivot && rightDockPivot) {
        leftDockPivot.rotation.z = THREE.MathUtils.lerp(0, -0.17, assembly);
        rightDockPivot.rotation.z = THREE.MathUtils.lerp(0, 0.17, assembly);
      }

      const targetIntensity = active ? 4.8 : armed ? 1.15 + assembly * 1.45 : 0.32;
      energy.emissiveIntensity += (targetIntensity - energy.emissiveIntensity) * 0.08;
      modelSignalMaterials.forEach((material) => {
        const materialTarget = cardSignalMaterials.has(material) ? Math.min(targetIntensity, 2.4) : targetIntensity;
        material.emissiveIntensity += (materialTarget - material.emissiveIntensity) * 0.08;
      });
      redLight.intensity += ((active ? 10 : armed ? 3.2 + assembly * 2.8 : 1.1) - redLight.intensity) * 0.08;
      energyBars.forEach((bar, index) => {
        const pulse = active && !reducedMotion ? 1 + Math.sin(time * 0.008 + index) * 0.22 : 1;
        bar.scale.y += (pulse - bar.scale.y) * 0.12;
      });

      renderer.render(scene, camera);
    }
    frame = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [cardColor]);

  if (failed) {
    return (
      <div className="driver-fallback" role="img" aria-label="静态 Persona Driver">
        <span>PERSONA</span><strong>DRIVER</strong><small>当前设备不支持 WebGL 2</small>
      </div>
    );
  }

  return <div className="driver-canvas" ref={containerRef} aria-label="3D Persona Driver" />;
}
