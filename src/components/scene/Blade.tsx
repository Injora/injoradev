"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { createBladeGeometry, createEdgeRibbon, createGuardGeometry, BLADE_LENGTH } from "./bladeGeometry";
import { emptyKeyframe, sampleKeyframe } from "./keyframes";
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

const edgeUniforms = {
  uTime: { value: 0 },
  uEnergy: { value: 0.2 },
  uColor: { value: new THREE.Color("#4da3ff") },
};

function useBladeMaterial() {
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#d4d7de"),
      metalness: 1,
      roughness: 0.22,
      roughnessMap: createScratchTexture(),
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.2,
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
        // Hamon: a wavy temper line, visible even when the blade is sealed.
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float hamonLine = 0.2 + 0.035 * sin(vLen * 70.0) + 0.02 * sin(vLen * 23.0 + 1.3);
          float hamon = smoothstep(hamonLine + 0.03, hamonLine - 0.03, vEdge);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.18 + 0.04, hamon * 0.6);`
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.55, hamon);`
        )
        // Energy running up the cutting edge.
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float edgeMask = smoothstep(0.16, 0.0, vEdge);
          float flow = 0.5 + 0.5 * sin(vLen * 22.0 - uTime * 3.2);
          float pulse = 0.55 + 0.45 * flow;
          float baseFade = smoothstep(0.0, 0.1, vLen);
          totalEmissiveRadiance += uColor * edgeMask * pulse * baseFade * uEnergy * 2.4;
          totalEmissiveRadiance += uColor * hamon * uEnergy * 0.12;`
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
  const { camera, size } = useThree();

  const bladeGeo = useMemo(() => createBladeGeometry(), []);
  const ribbonGeo = useMemo(() => createEdgeRibbon(), []);
  const guardGeo = useMemo(() => createGuardGeometry(), []);
  const bladeMat = useBladeMaterial();

  const guardMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#1b1c22", metalness: 1, roughness: 0.32, clearcoat: 0.5, envMapIntensity: 1 }),
    []
  );
  const collarMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#9aa0ab", metalness: 1, roughness: 0.28, envMapIntensity: 1.1 }),
    []
  );
  const gripMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0b0b0f", metalness: 0.3, roughness: 0.78, envMapIntensity: 0.6 }),
    []
  );
  const energyLineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#4da3ff", ...additive, opacity: 0.8 }), []);

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
      [bladeMat, guardMat, collarMat, gripMat, energyLineMat, ribbonMat, haloMat, coreMat, ...ringMats].forEach((m) => m.dispose());
      bladeMat.roughnessMap?.dispose();
    },
    [bladeGeo, ribbonGeo, guardGeo, bladeMat, guardMat, collarMat, gripMat, energyLineMat, ribbonMat, haloMat, coreMat, ringMats]
  );

  const target = useMemo(() => emptyKeyframe(), []);
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), color: new THREE.Color(), dark: new THREE.Color("#121216"), steel: new THREE.Color("#d4d7de") }), []);
  const spinAngle = useRef(0);
  const first = useRef(true);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const g = outer.current;
    const s = spin.current;
    if (!g || !s) return;
    const rm = store.reducedMotion;

    sampleKeyframe(store.section, store.isMobile, target);

    // The intro brings the blade in from deep in the void.
    const intro = live.intro;
    const introEase = 1 - Math.pow(1 - intro, 3);
    const tx = target.pos[0];
    const ty = target.pos[1] + (1 - introEase) * -0.4;
    const tz = target.pos[2] - (1 - introEase) * 6;

    // Pointer gives a subtle, weighted response.
    const px = store.pointer.x;
    const py = store.pointer.y;
    const k = rm || first.current ? 1 : 1 - Math.exp(-dt * 2.6);
    first.current = false;
    g.position.x += (tx + px * 0.12 - g.position.x) * k;
    g.position.y += (ty + py * 0.08 - g.position.y) * k;
    g.position.z += (tz - g.position.z) * k;
    g.rotation.x += (target.tiltX - py * 0.18 - g.rotation.x) * k;
    g.rotation.z += (target.tiltZ - px * 0.12 - g.rotation.z) * k;
    g.rotation.y += (px * 0.35 - g.rotation.y) * k;
    const sc = target.scale * (0.85 + 0.15 * introEase);
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * k);

    // Slow spin about the blade's own axis; the Getsuga slash whips it round.
    const slash = live.slash;
    if (!rm) spinAngle.current += dt * (0.22 + live.surge * 1.2 + slash * 9);
    s.rotation.y = spinAngle.current + Math.sin(live.time * 0.4) * 0.25;

    // Hover: is the pointer near the blade on screen?
    tmp.v.set(0, 0, 0);
    g.localToWorld(tmp.v);
    tmp.v.project(camera);
    const dx = (tmp.v.x - px) * (size.width / size.height);
    const dy = tmp.v.y - py;
    const near = Math.exp(-(dx * dx + dy * dy) * 3);
    live.hover += (near - live.hover) * (1 - Math.exp(-dt * 4));

    const energy = live.energy + live.hover * 0.25;
    edgeUniforms.uEnergy.value = energy * live.light;
    ribbonMat.uniforms.uEnergy.value = energy * live.light;

    // Black blade in bankai.
    tmp.color.copy(tmp.steel).lerp(tmp.dark, live.dark);
    bladeMat.color.copy(tmp.color);
    bladeMat.envMapIntensity = (0.12 + 1.1 * live.light) * introEase * (1 - live.dark * 0.35);
    guardMat.envMapIntensity = collarMat.envMapIntensity = bladeMat.envMapIntensity;
    energyLineMat.color.copy(live.color);
    energyLineMat.opacity = (0.25 + energy * 0.75) * live.light * introEase;

    haloMat.uniforms.uIntensity.value = (0.18 + energy * 0.28) * live.light * introEase;
    (haloMat.uniforms.uColor.value as THREE.Color).copy(live.color).multiplyScalar(0.55);
    coreMat.uniforms.uIntensity.value = (0.35 + energy * 0.9) * introEase * (0.6 + 0.4 * live.light);

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
        const spread = 0.55 + r * (0.35 + i * 0.28);
        m.scale.setScalar(spread);
        if (!rm) m.rotation.z += dt * (0.25 + i * 0.12) * (i % 2 ? -1 : 1) * (1 + live.surge * 3);
        ringMats[i].color.copy(live.color);
        ringMats[i].opacity = r * (0.5 - i * 0.12) * introEase;
      });
    }
  });

  const gripRings = [-0.22, -0.42, -0.62, -0.82];

  return (
    <>
      <mesh ref={halo} material={haloMat} renderOrder={-1}>
        <planeGeometry args={[9, 9]} />
      </mesh>
      <group ref={outer}>
        <group ref={spin}>
          {/* model is authored with the guard at y=0; recentre on its length */}
          <group position={[0, -1.15, 0]}>
            <mesh geometry={bladeGeo} material={bladeMat} position={[0, 0.1, 0]} />
            <mesh geometry={ribbonGeo} material={ribbonMat} position={[0, 0.1, 0]} />
            {/* collar */}
            <mesh material={collarMat} position={[-0.01, 0.12, 0]}>
              <boxGeometry args={[0.32, 0.14, 0.095]} />
            </mesh>
            <mesh geometry={guardGeo} material={guardMat} />
            {/* grip */}
            <mesh material={gripMat} position={[0, -0.55, 0]}>
              <cylinderGeometry args={[0.068, 0.074, 1.0, 24]} />
            </mesh>
            {gripRings.map((y) => (
              <mesh key={y} material={energyLineMat} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.074, 0.0045, 6, 40]} />
              </mesh>
            ))}
            <mesh material={guardMat} position={[0, -1.08, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.08, 24]} />
            </mesh>
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
    vec3 p = vec3(cos(ang) * r, -1.2 + h * ${(BLADE_LENGTH + 0.1).toFixed(2)}, sin(ang) * r);
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
    material.uniforms.uEnergy.value = Math.max(0, live.energy - 0.3) * 1.2 * live.light + live.surge;
  });

  // bounding sphere is irrelevant for shader-placed points
  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

export { edgeUniforms };
