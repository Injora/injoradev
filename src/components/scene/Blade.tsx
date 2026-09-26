"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { createBladeGeometry, createEdgeRibbon, createGuardGeometry, BLADE_LENGTH } from "./bladeGeometry";

/** pommel → tip, plus a little breathing room, in model units */
const MODEL_LENGTH = 5.4;
import { live } from "./live";
import { seeded } from "./random";

/** Procedural scratch/roughness map — fine lines along the length of the blade. */
function createScratchTexture() {
  const w = 1024;
  const h = 128;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgb(70,70,70)";
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const l = 20 + rnd() * 220;
    const a = (rnd() - 0.5) * 0.08;
    const v = rnd() < 0.5 ? 40 + rnd() * 25 : 100 + rnd() * 80;
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.25 + rnd() * 0.5})`;
    ctx.lineWidth = rnd() < 0.9 ? 0.6 : 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 8);
    ctx.stroke();
  }
  for (let i = 0; i < 4000; i++) {
    const v = 50 + rnd() * 60;
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fillRect(rnd() * w, rnd() * h, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Black cord crossing over red diamonds, drawn once to a canvas. */
function createGripTexture() {
  const w = 256;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, w, h);
  const rows = 11;
  const step = h / rows;
  for (let i = 0; i < rows; i++) {
    const cy = step * (i + 0.5);
    // diamonds on the front and back faces of the grip
    for (const cx of [w * 0.25, w * 0.75]) {
      const g = ctx.createLinearGradient(cx, cy - step * 0.4, cx, cy + step * 0.4);
      g.addColorStop(0, "#4a060d");
      g.addColorStop(0.5, "#8e0f1d");
      g.addColorStop(1, "#40050b");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, cy - step * 0.36);
      ctx.lineTo(cx + w * 0.085, cy);
      ctx.lineTo(cx, cy + step * 0.36);
      ctx.lineTo(cx - w * 0.085, cy);
      ctx.closePath();
      ctx.fill();
    }
    // subtle weave highlight on the black cord
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(0, cy - step * 0.5 + k * 6);
      ctx.lineTo(w, cy + step * 0.5 - k * 6);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const edgeUniforms = {
  uTime: { value: 0 },
  uEnergy: { value: 0.2 },
  uColor: { value: new THREE.Color("#ff2338") },
};

function useBladeMaterial() {
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#141418"),
      metalness: 0.9,
      roughness: 0.34,
      roughnessMap: createScratchTexture(),
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.4,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, edgeUniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nattribute float aEdge;\nattribute float aLen;\nvarying float vEdge;\nvarying float vLen;"
        )
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEdge = aEdge;\nvLen = aLen;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTime;\nuniform float uEnergy;\nuniform vec3 uColor;\nvarying float vEdge;\nvarying float vLen;"
        )
        // Black blade; only the freshly sharpened edge shows bare steel.
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float bevel = smoothstep(0.075, 0.03, vEdge);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.43, 0.46), bevel);
          float hamon = bevel;`
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.14, bevel);`
        )
        // Energy running up the cutting edge.
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float edgeMask = smoothstep(0.1, 0.0, vEdge);
          float flow = 0.5 + 0.5 * sin(vLen * 22.0 - uTime * 3.2);
          float pulse = 0.55 + 0.45 * flow;
          float baseFade = smoothstep(0.0, 0.1, vLen);
          totalEmissiveRadiance += uColor * edgeMask * pulse * baseFade * uEnergy * 2.4;
          totalEmissiveRadiance += uColor * hamon * uEnergy * 0.25;`
        );
    };
    return m;
  }, []);
}

const ribbonVertex = /* glsl */ `
  attribute float aSide;
  attribute float aLen;
  varying float vSide;
  varying float vLen;
  void main() {
    vSide = aSide;
    vLen = aLen;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ribbonFragment = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform vec3 uColor;
  varying float vSide;
  varying float vLen;
  void main() {
    float falloff = exp(-vSide * 7.0);
    float flow = 0.6 + 0.4 * sin(vLen * 16.0 - uTime * 2.6);
    float ends = smoothstep(0.0, 0.12, vLen) * smoothstep(1.0, 0.8, vLen);
    float a = falloff * flow * ends * uEnergy * 0.55;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const haloFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float core = exp(-r * r * 22.0);
    float ang = atan(p.y, p.x);
    // slow volumetric shafts
    float shafts = pow(abs(sin(ang * 5.0 + uTime * 0.05)), 24.0) + pow(abs(sin(ang * 3.0 - uTime * 0.035 + 1.0)), 30.0);
    float a = (core * 0.9 + shafts * exp(-r * 5.0) * 0.35) * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;
const coreFragment = /* glsl */ `
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float a = (exp(-r * r * 9.0) + exp(-r * 3.5) * 0.35) * uIntensity;
    vec3 c = mix(uColor, vec3(1.0), exp(-r * r * 40.0));
    gl_FragColor = vec4(c * a, a);
  }
`;

const additive = {
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
} as const;

export function Blade() {
  const outer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const pommel = useRef<THREE.Object3D>(null);
  const { camera, size } = useThree();

  const bladeGeo = useMemo(() => createBladeGeometry(), []);
  const ribbonGeo = useMemo(() => createEdgeRibbon(), []);
  const guardGeo = useMemo(() => createGuardGeometry(), []);
  const bladeMat = useBladeMaterial();

  const guardMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#16161a", metalness: 0.95, roughness: 0.3, clearcoat: 0.7, envMapIntensity: 1.2 }),
    []
  );
  const collarMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#1c1c21", metalness: 1, roughness: 0.25, clearcoat: 0.6, envMapIntensity: 1.2 }),
    []
  );
  const gripMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: createGripTexture(), metalness: 0.1, roughness: 0.82, envMapIntensity: 0.5 }),
    []
  );

  const ribbonMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ribbonVertex,
        fragmentShader: ribbonFragment,
        uniforms: { uTime: edgeUniforms.uTime, uEnergy: { value: 0 }, uColor: edgeUniforms.uColor },
        side: THREE.DoubleSide,
        ...additive,
      }),
    []
  );
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: haloFragment,
        uniforms: { uTime: edgeUniforms.uTime, uIntensity: { value: 0 }, uColor: { value: new THREE.Color("#2a5fa8") } },
        ...additive,
      }),
    []
  );
  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: coreFragment,
        uniforms: { uIntensity: { value: 0 }, uColor: edgeUniforms.uColor },
        ...additive,
      }),
    []
  );
  const ringMats = useMemo(
    () => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: "#4da3ff", ...additive, opacity: 0 })),
    []
  );

  useEffect(
    () => () => {
      [bladeGeo, ribbonGeo, guardGeo].forEach((g) => g.dispose());
      [bladeMat, guardMat, collarMat, gripMat, ribbonMat, haloMat, coreMat, ...ringMats].forEach((m) => m.dispose());
      bladeMat.roughnessMap?.dispose();
      gripMat.map?.dispose();
    },
    [bladeGeo, ribbonGeo, guardGeo, bladeMat, guardMat, collarMat, gripMat, ribbonMat, haloMat, coreMat, ringMats]
  );

  const tmp = useMemo(() => ({ v: new THREE.Vector3() }), []);
  const spinAngle = useRef(0);
  const first = useRef(true);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const g = outer.current;
    const s = spin.current;
    if (!g || !s) return;
    const rm = store.reducedMotion;

    // Where to stand comes from the layout solver (viewport px) — see lib/bladeLayout.
    const bt = store.blade;
    const cam = camera as THREE.PerspectiveCamera;
    const depth = bt.ambient ? 9 : 1.0; // world units behind z=0
    const dist = cam.position.z + depth;
    const worldH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * dist;
    const worldW = worldH * (size.width / size.height);
    const ready = store.bladeReady;
    const targetX = ready ? (bt.cx / size.width - 0.5) * worldW : 0;
    const targetY = ready ? -(bt.cy / size.height - 0.5) * worldH : 0;
    const targetScale = ready ? ((bt.length / size.height) * worldH) / MODEL_LENGTH : 0.7;

    // The intro brings the blade in from deep in the void.
    const intro = live.intro;
    const introEase = 1 - Math.pow(1 - intro, 3);
    const tx = targetX;
    const ty = targetY + (1 - introEase) * -0.4;
    const tz = -depth - (1 - introEase) * 6;

    // Pointer gives a subtle, weighted response. Position glides a little
    // slower than rotation so relocations read as a deliberate move.
    const px = store.pointer.x;
    const py = store.pointer.y;
    const snap = rm || first.current;
    const k = snap ? 1 : 1 - Math.exp(-dt * 2.2);
    const kr = snap ? 1 : 1 - Math.exp(-dt * 2.8);
    first.current = false;
    g.position.x += (tx + px * 0.1 - g.position.x) * k;
    g.position.y += (ty + py * 0.06 - g.position.y) * k;
    g.position.z += (tz - g.position.z) * k;
    g.rotation.x += (0.06 - py * 0.14 - g.rotation.x) * kr;
    g.rotation.z += (bt.angle - px * 0.06 - g.rotation.z) * kr;
    g.rotation.y += (px * 0.3 - g.rotation.y) * kr;
    const sc = targetScale * (0.85 + 0.15 * introEase);
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * k);

    // Slow spin about the blade's own axis; the Getsuga slash whips it round.
    const slash = live.slash;
    // Mostly face-on so the black blade reads as a silhouette; the Getsuga
    // slash (and a surge) whip it through full turns.
    if (!rm) spinAngle.current += dt * (live.surge * 1.2 + slash * 9);
    s.rotation.y = spinAngle.current + (rm ? 0 : Math.sin(live.time * 0.35) * 0.55);

    // Hover: is the pointer near the blade on screen?
    tmp.v.set(0, 0, 0);
    g.localToWorld(tmp.v);
    tmp.v.project(camera);
    const dx = (tmp.v.x - px) * (size.width / size.height);
    const dy = tmp.v.y - py;
    const near = Math.exp(-(dx * dx + dy * dy) * 3);
    live.hover += (near - live.hover) * (1 - Math.exp(-dt * 4));

    const energy = live.energy + live.hover * 0.25;
    edgeUniforms.uEnergy.value = energy * live.light * live.presence;
    ribbonMat.uniforms.uEnergy.value = energy * live.light * live.presence;

    bladeMat.envMapIntensity = (0.2 + 0.85 * live.light) * introEase;
    // Fade the solid parts when retreating; depthWrite off keeps the ghost clean.
    const presence = live.presence;
    for (const m of [bladeMat, guardMat, collarMat, gripMat]) {
      const ghost = presence < 0.98;
      if (m.transparent !== ghost) {
        m.transparent = ghost;
        m.depthWrite = !ghost;
        m.needsUpdate = true;
      }
      m.opacity = presence;
    }
    guardMat.envMapIntensity = collarMat.envMapIntensity = gripMat.envMapIntensity = bladeMat.envMapIntensity * 0.85;

    haloMat.uniforms.uIntensity.value = (0.18 + energy * 0.28) * live.light * introEase * live.presence;
    (haloMat.uniforms.uColor.value as THREE.Color).copy(live.color).multiplyScalar(0.55);
    coreMat.uniforms.uIntensity.value = (0.35 + energy * 0.9) * introEase * (0.6 + 0.4 * live.light) * live.presence;

    // Halo sits behind the blade in world space, facing the camera.
    if (halo.current) {
      halo.current.position.set(g.position.x, g.position.y, g.position.z - 1.2);
      halo.current.quaternion.copy(camera.quaternion);
    }

    // Orbiting rings open with energy.
    if (rings.current) {
      const r = live.rings;
      rings.current.children.forEach((child, i) => {
        const m = child as THREE.Mesh;
        const spread = 0.42 + r * (0.16 + i * 0.12);
        m.scale.setScalar(spread);
        if (!rm) m.rotation.z += dt * (0.25 + i * 0.12) * (i % 2 ? -1 : 1) * (1 + live.surge * 3);
        ringMats[i].color.copy(live.color);
        ringMats[i].opacity = r * (0.32 - i * 0.08) * introEase * live.light * live.presence;
      });
    }
  });

  return (
    <>
      <mesh ref={halo} material={haloMat} renderOrder={-1}>
        <planeGeometry args={[9, 9]} />
      </mesh>
      <group ref={outer}>
        <group ref={spin}>
          {/* model is authored with the guard at y=0; recentre on its length */}
          <group position={[0, -1.1, 0]}>
            <mesh geometry={bladeGeo} material={bladeMat} position={[0, 0.1, 0]} />
            <mesh geometry={ribbonGeo} material={ribbonMat} position={[0, 0.1, 0]} />
            {/* collar */}
            <mesh material={collarMat} position={[-0.01, 0.11, 0]}>
              <boxGeometry args={[0.3, 0.12, 0.1]} />
            </mesh>
            <mesh geometry={guardGeo} material={guardMat} />
            {/* grip: black cord over red diamonds */}
            <mesh material={gripMat} position={[0, -0.7, 0]}>
              <cylinderGeometry args={[0.07, 0.075, 1.3, 32, 1]} />
            </mesh>
            <mesh material={guardMat} position={[0, -1.38, 0]}>
              <cylinderGeometry args={[0.078, 0.072, 0.07, 24]} />
            </mesh>
            <object3D ref={pommel} position={[0, -1.42, 0]} />
            {/* energy core at the guard */}
            <mesh material={coreMat}>
              <planeGeometry args={[0.9, 0.9]} />
            </mesh>
            <group ref={rings} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
              {ringMats.map((m, i) => (
                <mesh key={i} material={m}>
                  <torusGeometry args={[1, 0.0035 + i * 0.001, 6, 120]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>
      <Sparks outer={outer} />
      <Chain anchor={pommel} outer={outer} />
    </>
  );
}

/* ─────────── Sparks: embers rising along the blade as energy builds ─────────── */

const sparkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uPixelRatio;
  attribute vec3 aData; // angle, radius, speed
  attribute float aOffset;
  varying float vAlpha;
  void main() {
    float h = mod(aOffset + uTime * 0.35 * aData.z, 1.0);
    float ang = aData.x + uTime * (0.4 + aData.z * 0.6);
    float r = aData.y * (0.6 + h * 0.8);
    vec3 p = vec3(cos(ang) * r, -1.0 + h * ${(BLADE_LENGTH - 0.1).toFixed(2)}, sin(ang) * r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.4 + aData.z * 1.6) * uPixelRatio * (8.0 / -mv.z);
    vAlpha = sin(h * 3.14159) * uEnergy;
  }
`;
const sparkFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.35) * a, a);
  }
`;

function Sparks({ outer }: { outer: React.RefObject<THREE.Group | null> }) {
  const ref = useRef<THREE.Points>(null);
  const count = store.isMobile ? 70 : 180;
  const { geometry, material } = useMemo(() => {
    const rnd = seeded(11);
    const data = new Float32Array(count * 3);
    const offset = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      data[i * 3] = rnd() * Math.PI * 2;
      data[i * 3 + 1] = 0.15 + rnd() * 0.55;
      data[i * 3 + 2] = 0.3 + rnd();
      offset[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aData", new THREE.BufferAttribute(data, 3));
    g.setAttribute("aOffset", new THREE.BufferAttribute(offset, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: sparkVertex,
      fragmentShader: sparkFragment,
      uniforms: {
        uTime: edgeUniforms.uTime,
        uEnergy: { value: 0 },
        uPixelRatio: { value: 1 },
        uColor: edgeUniforms.uColor,
      },
      ...additive,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);

  useFrame((state) => {
    const p = ref.current;
    const o = outer.current;
    if (!p || !o) return;
    p.position.copy(o.position);
    p.rotation.copy(o.rotation);
    p.scale.copy(o.scale);
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    material.uniforms.uEnergy.value = (Math.max(0, live.energy - 0.3) * 1.2 * live.light + live.surge) * live.presence;
  });

  // bounding sphere is irrelevant for shader-placed points
  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

export { edgeUniforms };

/* ─────────── Chain: a verlet rope hanging from the pommel ─────────── */

const LINKS = 18;
const LINK_LEN = 0.05;

function Chain({ anchor, outer }: { anchor: React.RefObject<THREE.Object3D | null>; outer: React.RefObject<THREE.Group | null> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const sim = useMemo(
    () => ({
      p: Array.from({ length: LINKS + 1 }, () => new THREE.Vector3()),
      prev: Array.from({ length: LINKS + 1 }, () => new THREE.Vector3()),
      ready: false,
      a: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      mid: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      roll: new THREE.Quaternion(),
      m: new THREE.Matrix4(),
      s: new THREE.Vector3(),
      x: new THREE.Vector3(1, 0, 0),
    }),
    []
  );
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#1a1a1f", metalness: 1, roughness: 0.3, clearcoat: 0.5, envMapIntensity: 1.3 }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, dtRaw) => {
    const a = anchor.current;
    const o = outer.current;
    const im = mesh.current;
    if (!a || !o || !im) return;
    const dt = Math.min(dtRaw, 1 / 30);
    const scale = o.scale.x;
    const seg = LINK_LEN * scale;
    a.getWorldPosition(sim.a);
    const { p, prev } = sim;

    if (!sim.ready) {
      for (let i = 0; i <= LINKS; i++) {
        p[i].set(sim.a.x, sim.a.y - i * seg, sim.a.z);
        prev[i].copy(p[i]);
      }
      sim.ready = true;
    }

    // integrate
    const g = -26 * scale * dt * dt;
    for (let i = 1; i <= LINKS; i++) {
      const cur = p[i];
      const vx = (cur.x - prev[i].x) * 0.985;
      const vy = (cur.y - prev[i].y) * 0.985;
      const vz = (cur.z - prev[i].z) * 0.985;
      prev[i].copy(cur);
      cur.x += vx;
      cur.y += vy + g;
      cur.z += vz;
    }
    // constraints
    p[0].copy(sim.a);
    for (let it = 0; it < 14; it++) {
      p[0].copy(sim.a);
      for (let i = 0; i < LINKS; i++) {
        const A = p[i];
        const B = p[i + 1];
        sim.dir.subVectors(B, A);
        const d = sim.dir.length() || 1e-6;
        const diff = (d - seg) / d;
        if (i === 0) B.addScaledVector(sim.dir, -diff);
        else {
          A.addScaledVector(sim.dir, diff * 0.5);
          B.addScaledVector(sim.dir, -diff * 0.5);
        }
      }
    }

    // place links: alternate each link's roll by 90° like a real chain
    for (let i = 0; i < LINKS; i++) {
      sim.dir.subVectors(p[i + 1], p[i]).normalize();
      sim.mid.addVectors(p[i], p[i + 1]).multiplyScalar(0.5);
      sim.q.setFromUnitVectors(sim.x, sim.dir);
      sim.roll.setFromAxisAngle(sim.x, i % 2 ? Math.PI / 2 : 0);
      sim.q.multiply(sim.roll);
      sim.s.set(scale * 1.35, scale, scale);
      sim.m.compose(sim.mid, sim.q, sim.s);
      im.setMatrixAt(i, sim.m);
    }
    im.instanceMatrix.needsUpdate = true;
    material.envMapIntensity = 1.3 * live.intro * (0.4 + 0.6 * live.light);
    material.transparent = live.presence < 0.98;
    material.opacity = live.presence;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, material, LINKS]} frustumCulled={false}>
      <torusGeometry args={[0.02, 0.0055, 6, 14]} />
    </instancedMesh>
  );
}
