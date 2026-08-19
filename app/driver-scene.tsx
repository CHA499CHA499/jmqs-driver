"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

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
      setFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
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

    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

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

      const targetIntensity = active ? 4.8 : armed ? 1.15 + assembly * 1.45 : 0.32;
      energy.emissiveIntensity += (targetIntensity - energy.emissiveIntensity) * 0.08;
      redLight.intensity += ((active ? 10 : armed ? 3.2 + assembly * 2.8 : 1.1) - redLight.intensity) * 0.08;
      energyBars.forEach((bar, index) => {
        const pulse = active && !reducedMotion ? 1 + Math.sin(time * 0.008 + index) * 0.22 : 1;
        bar.scale.y += (pulse - bar.scale.y) * 0.12;
      });

      renderer.render(scene, camera);
    }
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
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
