"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { createBladeGeometry, createEdgeRibbon, createGuardGeometry, shatterGeometry, BLADE_LENGTH } from "./bladeGeometry";
import { live } from "./live";
import { seeded } from "./random";

/**
 * Kyōka Suigetsu — a polished katana that falls through the page, shatters
 * like a mirror at the end of the journey, and reunites horizontally at the
 * very bottom. All of it is driven by scroll (see store.fall / shatter /
 * reunite), so it plays in reverse when you scroll back up.
 */

/** pommel → tip in model units */
const MODEL_LENGTH = 5.2;

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

/** Dark teal cord over white diamonds (the classic tsukamaki), drawn once. */
function createGripTexture() {
  const w = 256;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#12262d";
  ctx.fillRect(0, 0, w, h);
  const rows = 12;
  const step = h / rows;
  for (let i = 0; i < rows; i++) {
    const cy = step * (i + 0.5);
    for (const cx of [w * 0.25, w * 0.75]) {
      const g = ctx.createLinearGradient(cx - w * 0.08, cy, cx + w * 0.08, cy);
      g.addColorStop(0, "#bdbab1");
      g.addColorStop(0.5, "#efece4");
      g.addColorStop(1, "#aaa79e");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, cy - step * 0.34);
      ctx.lineTo(cx + w * 0.09, cy);
      ctx.lineTo(cx, cy + step * 0.34);
      ctx.lineTo(cx - w * 0.09, cy);
      ctx.closePath();
      ctx.fill();
    }
    // cord weave highlights
    ctx.strokeStyle = "rgba(120,190,200,0.10)";
    ctx.lineWidth = 3;
    for (let k = 0; k < 7; k++) {
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
  uColor: { value: new THREE.Color("#4da3ff") },
};

const shatterUniforms = {
  uScatter: { value: 0 },
  uScrollSpin: { value: 0 },
};

const ROTATE_GLSL = /* glsl */ `
  vec3 rotateAxis(vec3 p, vec3 axis, float a) {
    float c = cos(a);
    float s = sin(a);
    return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
  }
`;

function useBladeMaterial() {
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#dfe2e8"),
      metalness: 1,
      roughness: 0.16,
      roughnessMap: createScratchTexture(),
      clearcoat: 0.5,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.3,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, edgeUniforms, shatterUniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float uScatter;
          uniform float uScrollSpin;
          uniform float uTime;
          attribute float aEdge;
          attribute float aLen;
          attribute vec3 aShardCenter;
          attribute vec3 aShardDir;
          attribute float aShardSeed;
          varying float vEdge;
          varying float vLen;
          varying float vScatter;
          ${ROTATE_GLSL}`
        )
        // each shard tumbles about its own axis…
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
          vec3 shAxis = normalize(vec3(aShardDir.y, -aShardDir.x, aShardDir.z + 0.3));
          float shAng = uScatter * (1.8 + aShardSeed * 3.5 + uScrollSpin * (aShardSeed - 0.5));
          objectNormal = rotateAxis(objectNormal, shAxis, shAng);`
        )
        // …and drifts away from where it was, hovering while shattered.
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vEdge = aEdge;
          vLen = aLen;
          vScatter = uScatter;
          vec3 local = rotateAxis(transformed - aShardCenter, shAxis, shAng);
          vec3 drift = vec3(sin(uTime * 0.5 + aShardSeed * 40.0), cos(uTime * 0.4 + aShardSeed * 25.0), sin(uTime * 0.3 + aShardSeed * 9.0)) * 0.12;
          transformed = aShardCenter + local + (aShardDir * (1.4 + aShardSeed * 1.6) + drift) * uScatter;`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTime;\nuniform float uEnergy;\nuniform vec3 uColor;\nvarying float vEdge;\nvarying float vLen;\nvarying float vScatter;"
        )
        // Pronounced wavy hamon, as on the reference blade.
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float hamonLine = 0.24 + 0.05 * sin(vLen * 55.0) + 0.025 * sin(vLen * 131.0 + 1.3);
          float hamon = smoothstep(hamonLine + 0.025, hamonLine - 0.025, vEdge);
          diffuseColor.rgb = mix(diffuseColor.rgb * 0.82, diffuseColor.rgb * 1.12 + 0.05, hamon);`
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor * 1.3, roughnessFactor * 0.5, hamon);`
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float edgeMask = smoothstep(0.1, 0.0, vEdge);
          float flow = 0.5 + 0.5 * sin(vLen * 22.0 - uTime * 3.2);
          float baseFade = smoothstep(0.0, 0.1, vLen);
          totalEmissiveRadiance += uColor * edgeMask * (0.55 + 0.45 * flow) * baseFade * uEnergy * 2.0;
          // shards catch a cold glint while they float
          totalEmissiveRadiance += vec3(0.55, 0.75, 1.0) * vScatter * 0.06;`
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
  const hilt = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();

  const bladeGeo = useMemo(() => {
    const base = createBladeGeometry();
    const shards = shatterGeometry(base);
    base.dispose();
    return shards;
  }, []);
  const ribbonGeo = useMemo(() => createEdgeRibbon(), []);
  const guardGeo = useMemo(() => createGuardGeometry(), []);
  const bladeMat = useBladeMaterial();

  const brassMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#b8924a", metalness: 1, roughness: 0.28, clearcoat: 0.4, envMapIntensity: 1.2 }),
    []
  );
  const gripMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: createGripTexture(), metalness: 0.1, roughness: 0.78, envMapIntensity: 0.6 }),
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

  useEffect(
    () => () => {
      [bladeGeo, ribbonGeo, guardGeo].forEach((g) => g.dispose());
      [bladeMat, brassMat, gripMat, ribbonMat, haloMat, coreMat].forEach((m) => m.dispose());
      bladeMat.roughnessMap?.dispose();
      gripMat.map?.dispose();
    },
    [bladeGeo, ribbonGeo, guardGeo, bladeMat, brassMat, gripMat, ribbonMat, haloMat, coreMat]
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
    const W = size.width;
    const H = size.height;

    // ── choreography ──────────────────────────────────────────────
    const shatter = store.shatter;
    const reunite = store.reunite;
    const smooth = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    // shards fly apart with the shatter and come home with the reunion
    const scatter = shatter * (1 - smooth(0.2, 1, reunite));
    // the formation turns horizontal while it is still in pieces
    const turn = smooth(0, 0.75, reunite);

    const fallLen = H * (store.isMobile ? 0.6 : 0.78);
    const finalLen = Math.min(W * 0.66, H * 1.1);
    const lenPx = fallLen + (finalLen - fallLen) * turn;
    store.bladeWidthPx = fallLen * 0.12;

    const lane = store.laneReady ? store.lane.cx : W * 0.72;
    const fallY = H * (0.42 + 0.16 * store.fall) + (rm ? 0 : Math.sin(live.time * 0.6) * H * 0.008);
    const cxPx = lane + (W / 2 - lane) * shatter;
    const finaleY = store.finaleY || H * 0.44;
    // hover mid-screen while shattered; settle into the clear band to reunite
    const shardY = H * 0.44 + (finaleY - H * 0.44) * turn;
    const cyPx = fallY + (shardY - fallY) * shatter;

    // viewport px → world, at the blade's depth
    const cam = camera as THREE.PerspectiveCamera;
    const depth = 1;
    const worldH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * (cam.position.z + depth);
    const worldW = worldH * (W / H);
    const intro = live.intro;
    const introEase = 1 - Math.pow(1 - intro, 3);
    // intro: the blade drops in from above the frame
    const tx = (cxPx / W - 0.5) * worldW;
    const ty = -(cyPx / H - 0.5) * worldH + (1 - introEase) * worldH * 0.9;
    const tz = -depth;
    const targetScale = ((lenPx / H) * worldH) / MODEL_LENGTH;

    const px = store.pointer.x;
    const py = store.pointer.y;
    const snap = rm || first.current;
    const k = snap ? 1 : 1 - Math.exp(-dt * 2.4);
    first.current = false;
    g.position.x += (tx + px * 0.08 - g.position.x) * k;
    g.position.y += (ty + py * 0.05 - g.position.y) * (snap ? 1 : 1 - Math.exp(-dt * 3.2));
    g.position.z += (tz - g.position.z) * k;
    // tip down (π) while falling → tip right (3π/2) when reunited
    const angle = Math.PI + (Math.PI / 2) * turn;
    g.rotation.z += (angle - px * 0.05 - g.rotation.z) * k;
    g.rotation.x += (0.05 - py * 0.1 - g.rotation.x) * k;
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * k);

    // A falling sword turns slowly, flashing the mirror of its flat; it
    // settles face-on once reunited. The Getsuga easter egg still whips it.
    const slash = live.slash;
    if (!rm) spinAngle.current += dt * ((0.45 + Math.min(Math.abs(store.velocity) * 0.02, 1.5)) * (1 - turn) + live.surge * 1.2 + slash * 9);
    const settle = turn;
    s.rotation.y = spinAngle.current * (1 - settle) + Math.round(spinAngle.current / Math.PI) * Math.PI * settle;

    // hilt drifts off on its own while the blade is in pieces
    if (hilt.current) {
      hilt.current.position.set(0.12 * scatter, -0.25 * scatter, 0);
      hilt.current.rotation.set(0, 0, 0.35 * scatter);
    }
    shatterUniforms.uScatter.value = scatter;
    shatterUniforms.uScrollSpin.value = store.scroll * 14;

    // presence: ghost the falling blade when no clear lane exists
    const ghost = shatter < 0.05 && store.laneReady && !store.lane.clear;
    live.presence += ((ghost ? 0.22 : 1) - live.presence) * (rm ? 1 : 1 - Math.exp(-dt * 2.4));
    const presence = live.presence;
    // Shards soften while they hover over the headline; the hilt dissolves
    // with the illusion and reforms as the pieces come home.
    const fade = (m: THREE.Material, opacity: number) => {
      const see = opacity < 0.98;
      if (m.transparent !== see) {
        m.transparent = see;
        m.depthWrite = !see;
        m.needsUpdate = true;
      }
      m.opacity = opacity;
    };
    // shards drift behind the rest of the page, so keep them quiet
    fade(bladeMat, presence * (1 - 0.55 * scatter));
    const hiltOpacity = presence * (1 - smooth(0.05, 0.6, scatter));
    fade(brassMat, hiltOpacity);
    fade(gripMat, hiltOpacity);
    if (hilt.current) hilt.current.visible = hiltOpacity > 0.01;

    // hover: is the pointer near the blade on screen?
    tmp.v.set(0, 0, 0);
    g.localToWorld(tmp.v);
    tmp.v.project(camera);
    const dx = (tmp.v.x - px) * (W / H);
    const dy = tmp.v.y - py;
    const near = Math.exp(-(dx * dx + dy * dy) * 3);
    live.hover += (near - live.hover) * (1 - Math.exp(-dt * 4));

    const energy = (live.energy + live.hover * 0.25) * (1 - scatter);
    edgeUniforms.uEnergy.value = energy * live.light * presence;
    ribbonMat.uniforms.uEnergy.value = energy * live.light * presence;
    bladeMat.envMapIntensity = (0.35 + 1.0 * live.light) * introEase;
    brassMat.envMapIntensity = gripMat.envMapIntensity = bladeMat.envMapIntensity * 0.9;

    haloMat.uniforms.uIntensity.value = (0.16 + energy * 0.25 + scatter * 0.15) * live.light * introEase * presence;
    (haloMat.uniforms.uColor.value as THREE.Color).copy(live.color).multiplyScalar(0.5);
    coreMat.uniforms.uIntensity.value = (0.25 + energy * 0.6) * introEase * presence * (1 - scatter);
    if (halo.current) {
      halo.current.position.set(g.position.x, g.position.y, g.position.z - 1.2);
      halo.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <>
      <mesh ref={halo} material={haloMat} renderOrder={-1}>
        <planeGeometry args={[9, 9]} />
      </mesh>
      <group ref={outer}>
        <group ref={spin}>
          {/* authored with the guard at y=0; recentre on the full length */}
          <group position={[0, -1.2, 0]}>
            <mesh geometry={bladeGeo} material={bladeMat} position={[0, 0.1, 0]} frustumCulled={false} />
            <mesh geometry={ribbonGeo} material={ribbonMat} position={[0, 0.1, 0]} />
            <group ref={hilt}>
              {/* habaki */}
              <mesh material={brassMat} position={[-0.01, 0.12, 0]}>
                <boxGeometry args={[0.27, 0.13, 0.095]} />
              </mesh>
              <mesh geometry={guardGeo} material={brassMat} />
              {/* grip: teal cord over white diamonds */}
              <mesh material={gripMat} position={[0, -0.66, 0]}>
                <cylinderGeometry args={[0.068, 0.074, 1.24, 32, 1]} />
              </mesh>
              {/* kashira */}
              <mesh material={brassMat} position={[0, -1.3, 0]}>
                <cylinderGeometry args={[0.078, 0.074, 0.09, 28]} />
              </mesh>
              <mesh material={coreMat}>
                <planeGeometry args={[0.8, 0.8]} />
              </mesh>
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
    vec3 p = vec3(cos(ang) * r, -1.1 + h * ${(BLADE_LENGTH).toFixed(2)}, sin(ang) * r);
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
