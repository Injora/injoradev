"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { store } from "@/lib/store";
import { Blade, edgeUniforms } from "./Blade";
import { emptyKeyframe, sampleKeyframe } from "./keyframes";
import { COLORS, live } from "./live";
import { Particles } from "./Particles";

/** Studio reflections generated on the GPU — no HDR download. */
function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Owns time, the intro, scroll-driven state and the camera. */
function Director() {
  const { camera } = useThree();
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const red = useRef<THREE.PointLight>(null);
  const kf = useMemo(() => emptyKeyframe(), []);
  const start = useRef<number | null>(null);
  const invalidate = useThree((s) => s.invalidate);

  // In reduced-motion mode we render on demand; re-render when scrolling.
  useEffect(() => {
    if (!store.reducedMotion) return;
    const on = () => invalidate();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [invalidate]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const rm = store.reducedMotion;
    const now = state.clock.elapsedTime;
    if (start.current === null) start.current = now;
    live.time = now;
    edgeUniforms.uTime.value = rm ? 0 : now;

    // Cinematic entrance: ~2.4s from darkness to lit.
    const introT = rm ? 1 : Math.min(1, Math.max(0, (now - start.current - 0.25) / 2.4));
    live.intro = introT;
    store.intro = introT;

    sampleKeyframe(store.section, store.isMobile, kf);
    const k = rm ? 1 : 1 - Math.exp(-dt * 3);
    const mode = store.mode;
    const bankai = mode === "bankai" ? 1 : 0;
    const surge = mode === "surge" ? 1 : 0;

    live.energy += (kf.energy + bankai * 0.7 + surge * 0.3 - live.energy) * k;
    live.rings += (Math.max(kf.rings, bankai, surge) - live.rings) * k;
    live.light += (kf.light * introT + bankai * 0.2 - live.light) * k;
    live.world += (kf.world - live.world) * k;
    live.red += (bankai - live.red) * (rm ? 1 : 1 - Math.exp(-dt * 2));
    live.dark += (bankai - live.dark) * (rm ? 1 : 1 - Math.exp(-dt * 1.5));
    live.surge += (surge - live.surge) * (rm ? 1 : 1 - Math.exp(-dt * 2.5));
    const since = (performance.now() - store.slashAt) / 1000;
    live.slash = since < 1.1 ? Math.sin((since / 1.1) * Math.PI) : 0;

    live.color.copy(COLORS.blue).lerp(COLORS.red, live.red);
    // The blade's own energy is crimson; bankai drives it toward white-hot.
    edgeUniforms.uColor.value.copy(COLORS.crimson).lerp(COLORS.hot, live.red * 0.45);

    // Camera travel: scroll pulls the world towards us.
    live.travel += (store.scroll * 90 - live.travel) * (rm ? 1 : 1 - Math.exp(-dt * 4));
    const px = store.pointer.x;
    const py = store.pointer.y;
    const cx = px * 0.28;
    const cy = py * 0.16 + (1 - introT) * 0.3;
    camera.position.x += (cx - camera.position.x) * (rm ? 1 : 1 - Math.exp(-dt * 2));
    camera.position.y += (cy - camera.position.y) * (rm ? 1 : 1 - Math.exp(-dt * 2));
    camera.position.z = 7 + (1 - introT) * 1.2;
    camera.lookAt(0, 0, -1);
    camera.rotation.z += Math.max(-0.02, Math.min(0.02, store.velocity * -0.0006));

    // Lighting follows the cursor.
    const L = introT;
    if (key.current) key.current.intensity = 2.2 * L * live.light;
    if (rim.current) {
      rim.current.position.set(px * 5, py * 3.5, 2.5);
      rim.current.intensity = (18 + live.energy * 22) * L * live.light;
      rim.current.color.copy(live.color);
    }
    if (red.current) red.current.intensity = (6 + live.red * 40) * L * live.light;
  });

  return (
    <>
      <directionalLight ref={key} position={[3, 4, 5]} intensity={0} color="#f2f4ff" />
      <pointLight ref={rim} position={[0, 0, 2.5]} intensity={0} distance={14} decay={1.6} />
      <pointLight ref={red} position={[-4, -2.5, -3]} intensity={0} distance={14} decay={1.6} color="#e21d35" />
    </>
  );
}

/** Drops resolution if the device can't hold the frame rate. */
function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const samples = useRef<number[]>([]);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current || store.reducedMotion) return;
    samples.current.push(dt);
    if (samples.current.length < 90) return;
    const avg = samples.current.slice(20).reduce((a, b) => a + b, 0) / (samples.current.length - 20);
    done.current = true;
    if (avg > 1 / 42) setDpr(1);
  });
  return null;
}

export default function Scene() {
  const mobile = store.isMobile;
  return (
    <Canvas
      frameloop={store.reducedMotion ? "demand" : "always"}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: mobile ? 42 : 35, position: [0, 0, 8], near: 0.1, far: 80 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(0x000000, 0);
      }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <Environment />
      <Director />
      <AdaptiveQuality />
      <Particles />
      <Blade />
    </Canvas>
  );
}
