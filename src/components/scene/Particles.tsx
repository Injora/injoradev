"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { live } from "./live";
import { seeded } from "./random";

const DEPTH = 60;

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  uniform float uStretch;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;
  varying float vTint;
  void main() {
    vec3 p = position;
    // endless tunnel: wrap depth as we travel
    p.z = mod(p.z + uTravel + uTime * 0.25, ${DEPTH.toFixed(1)}) - ${(DEPTH - 8).toFixed(1)};
    p.x += sin(uTime * 0.21 + aSeed * 6.283) * 0.25;
    p.y += cos(uTime * 0.17 + aSeed * 12.1) * 0.25;
    // parallax by depth
    float depth = clamp((p.z + 52.0) / 60.0, 0.0, 1.0);
    p.xy += uPointer * depth * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (26.0 / -mv.z) * (1.0 + uStretch * depth);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
    float nearFade = smoothstep(7.0, 3.0, p.z);
    float farFade = smoothstep(-52.0, -30.0, p.z);
    vAlpha = twinkle * nearFade * farFade;
    vTint = step(0.86, aSeed);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.6) * vAlpha * uOpacity;
    vec3 c = mix(uColorA, uColorB, vTint);
    gl_FragColor = vec4(c * a, a);
  }
`;

export function Particles() {
  const count = store.isMobile ? 650 : 2200;

  const { geometry, material } = useMemo(() => {
    const rnd = seeded(42);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // keep a clear corridor around the camera axis so particles don't smear the text
      const r = 1.2 + Math.pow(rnd(), 0.7) * 13;
      const a = rnd() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r * 1.3;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.8;
      pos[i * 3 + 2] = rnd() * DEPTH;
      seed[i] = rnd();
      size[i] = 0.6 + Math.pow(rnd(), 3) * 2.8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uTravel: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
        uPixelRatio: { value: 1 },
        uStretch: { value: 0 },
        uOpacity: { value: 0 },
        uColorA: { value: new THREE.Color("#c9ccd3") },
        uColorB: { value: new THREE.Color("#4da3ff") },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = store.reducedMotion ? 0 : live.time;
    u.uTravel.value = live.travel;
    (u.uPointer.value as THREE.Vector2).set(store.pointer.x, store.pointer.y);
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uStretch.value = Math.min(Math.abs(store.velocity) * 0.02, 1.2) + live.surge * 1.5;
    u.uOpacity.value = live.world * (0.35 + 0.65 * live.intro) * (1 + live.surge * 1.5);
    (u.uColorB.value as THREE.Color).copy(live.color);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
