"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { Particles } from "./Particles";
import { sea } from "./sea";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/*
 * The whole page is one water column, in document units (1 = one viewport):
 *   docY < horizon        night sky, moon, stars
 *   horizon < docY < split  the sea surface seen from above, moonlit
 *   docY > split          underwater: light shafts, caustics, then the abyss
 */
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform float uDepth;
  uniform float uPages;
  uniform float uHorizon;
  uniform float uSplit;
  uniform vec2 uPointer;
  uniform float uStorm;
  uniform float uGold;
  uniform float uIntro;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }
  // classic cheap caustic: interfering warped sine cells
  float caustic(vec2 p, float t) {
    vec2 q = p + vec2(fbm(p * 0.8 + t * 0.15), fbm(p * 0.8 - t * 0.12)) * 1.6;
    float c = abs(sin(q.x * 3.1 + t * 0.7) + sin(q.y * 2.7 - t * 0.5) + sin((q.x + q.y) * 2.2 + t * 0.3));
    return pow(1.0 - clamp(c / 3.0, 0.0, 1.0), 6.0);
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 uv = vUv;
    float t = uTime;
    float docY = uDepth + (1.0 - uv.y);
    vec2 moon = vec2(0.74 + uPointer.x * 0.01, 0.0);
    float swell = 0.004 + uStorm * 0.02;

    float horizon = uHorizon + sin(uv.x * 18.0 + t * 0.8) * swell * 0.25;
    float split = uSplit + (sin(uv.x * 7.0 - t * 1.3) * 0.012 + sin(uv.x * 19.0 + t * 2.1) * 0.005) * (1.0 + uStorm * 3.0);

    vec3 col;

    if (docY < horizon) {
      // ── sky ──
      float h = clamp((horizon - docY) / max(horizon, 0.001), 0.0, 1.0);
      col = mix(vec3(0.09, 0.27, 0.36), vec3(0.012, 0.05, 0.10), pow(h, 0.55));
      col = mix(col, vec3(0.02, 0.03, 0.06), uStorm * 0.7);
      // stars
      vec2 sp = vec2(uv.x * aspect, docY) * 220.0;
      float s = hash(floor(sp));
      float tw = 0.5 + 0.5 * sin(t * (1.0 + s * 3.0) + s * 40.0);
      col += vec3(0.85, 0.95, 1.0) * step(0.9965, s) * tw * smoothstep(0.15, 0.6, h) * (1.0 - uStorm);
      // moon + halo
      vec2 mp = vec2((uv.x - moon.x) * aspect, docY - (horizon - 0.34));
      float md = length(mp);
      col += vec3(0.95, 0.93, 0.82) * smoothstep(0.042, 0.038, md) * (1.0 - uStorm * 0.8);
      col += vec3(0.45, 0.75, 0.78) * exp(-md * 7.0) * 0.35;
      // storm clouds
      col = mix(col, vec3(0.05, 0.08, 0.1), smoothstep(0.45, 0.8, fbm(vec2(uv.x * 3.0 + t * 0.2, docY * 4.0))) * uStorm);
      // warm haze sitting on the horizon
      col += mix(vec3(0.25, 0.55, 0.55), vec3(0.96, 0.77, 0.42), 0.35 + uGold * 0.6) * exp(-(horizon - docY) * 14.0) * 0.35;
    } else if (docY < split) {
      // ── the sea from above ──
      float d = docY - horizon;
      vec2 pp = vec2((uv.x - 0.5) * aspect / (d + 0.035), 1.0 / (d + 0.035)) * vec2(1.6, 1.0);
      float w = noise(pp * vec2(2.2, 0.9) + vec2(0.0, t * 0.9)) * 0.6 + noise(pp * vec2(5.0, 2.0) - vec2(t * 0.4, t * 1.4)) * 0.4;
      col = mix(vec3(0.10, 0.30, 0.38), vec3(0.015, 0.11, 0.17), smoothstep(0.0, 0.35, d));
      col += vec3(0.12, 0.28, 0.3) * (w - 0.5) * 0.4;
      float path = exp(-pow((uv.x - moon.x) / (0.03 + d * 0.55), 2.0));
      // fine glints far out, softer and dimmer close to the viewer
      float sparkle = smoothstep(0.7, 0.98, w) * path * mix(1.0, 0.35, smoothstep(0.08, 0.4, d));
      col += vec3(0.95, 0.93, 0.8) * sparkle * (1.0 - uStorm * 0.6);
      col += vec3(0.4, 0.7, 0.7) * path * 0.08;
      col = mix(col, vec3(0.1, 0.3, 0.38), exp(-d * 40.0) * 0.6);
      // whitecaps when the storm comes in
      col += vec3(0.8) * smoothstep(0.82, 0.95, w) * uStorm * 0.6;
    } else {
      // ── underwater ──
      float depth = docY - split;
      float span = max(uPages - uSplit, 1.0);
      float k = clamp(depth / span, 0.0, 1.0);
      vec3 shallow = vec3(0.035, 0.25, 0.31);
      vec3 mid = vec3(0.016, 0.16, 0.24);
      vec3 deep = vec3(0.008, 0.07, 0.115);
      vec3 abyss = vec3(0.003, 0.025, 0.045);
      col = mix(shallow, mid, smoothstep(0.0, 0.1, k));
      col = mix(col, deep, smoothstep(0.1, 0.5, k));
      col = mix(col, abyss, smoothstep(0.5, 0.92, k));

      // light shafts falling from the surface, slanted and swaying
      float rx = uv.x * aspect * 0.9 + docY * 0.28 + uPointer.x * 0.05;
      float rays = fbm(vec2(rx * 3.0 + sin(t * 0.15) * 0.4, t * 0.06));
      rays = pow(smoothstep(0.35, 0.85, rays), 2.0);
      float reach = exp(-depth * 0.55);
      vec3 rayCol = mix(vec3(0.55, 0.95, 0.9), vec3(1.0, 0.82, 0.45), uGold);
      col += rayCol * rays * reach * (0.22 + uGold * 0.3) * (1.0 - uStorm * 0.5);

      // caustics dancing just under the surface
      vec2 cp = vec2(uv.x * aspect, docY) * 5.5;
      col += vec3(0.5, 0.95, 0.88) * caustic(cp, t) * exp(-depth * 2.2) * 0.28;

      // bright underside of the waterline
      col += vec3(0.55, 0.95, 0.9) * exp(-depth * 26.0) * 0.6;

      // bioluminescent bloom at the very bottom of the page
      float floorD = uPages - docY;
      float bloom = exp(-floorD * 1.6) * (0.75 + 0.25 * sin(t * 0.8));
      col += vec3(0.25, 0.9, 0.78) * bloom * 0.22 * fbm(vec2(uv.x * 4.0 + t * 0.05, docY * 2.0));
    }

    // vignette keeps the edges deep and the text legible
    vec2 vc = uv - 0.5;
    col *= 1.0 - dot(vc, vc) * 0.9;
    col *= uIntro;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Ocean() {
  const size = useThree((s) => s.size);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uDepth: { value: 0 },
          uPages: { value: 1 },
          uHorizon: { value: 0.55 },
          uSplit: { value: 1 },
          uPointer: { value: new THREE.Vector2() },
          uStorm: { value: 0 },
          uGold: { value: 0 },
          uIntro: { value: 0 },
        },
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const u = material.uniforms;
    u.uTime.value = sea.time;
    (u.uRes.value as THREE.Vector2).set(size.width, size.height);
    u.uDepth.value = store.depth;
    u.uPages.value = store.pages;
    u.uHorizon.value = store.horizon;
    u.uSplit.value = store.split;
    (u.uPointer.value as THREE.Vector2).set(store.pointer.x, store.pointer.y);
    u.uStorm.value = sea.storm;
    u.uGold.value = sea.gold;
    u.uIntro.value = sea.intro;
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/** Owns time, the fade-in from black and the easter-egg weather. */
function Director() {
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
    sea.time = rm ? 8 : now;
    sea.intro = rm ? 1 : Math.min(1, (now - start.current) / 1.6);
    const k = rm ? 1 : 1 - Math.exp(-dt * 1.8);
    sea.storm += ((store.mode === "storm" ? 1 : 0) - sea.storm) * k;
    sea.gold += ((store.mode === "treasure" ? 1 : 0) - sea.gold) * k;
  });
  return null;
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
    if (avg > 1 / 42) setDpr(0.75);
  });
  return null;
}

export default function Scene() {
  const mobile = store.isMobile;
  return (
    <Canvas
      frameloop={store.reducedMotion ? "demand" : "always"}
      dpr={mobile ? [0.8, 1.25] : [1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: false }}
      camera={{ fov: mobile ? 50 : 40, position: [0, 0, 8], near: 0.1, far: 80 }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <Director />
      <AdaptiveQuality />
      <Ocean />
      <Particles />
    </Canvas>
  );
}
