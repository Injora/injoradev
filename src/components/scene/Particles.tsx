"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { seeded } from "./random";
import { sea } from "./sea";

/* Marine snow drifting down, bubbles rising, and a few bioluminescent motes. */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  uniform float uStretch;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;
  varying float vKind;
  void main() {
    vec3 p = position;
    float bubble = step(0.8, aSeed);
    // bubbles rise fast and wobble; snow sinks slowly
    float drift = mix(-0.08, 0.55 + aSeed * 0.5, bubble);
    p.y = mod(p.y + uTravel + uTime * drift + 12.0, 24.0) - 12.0;
    p.x += sin(uTime * (0.3 + bubble * 2.0) + aSeed * 6.283) * mix(0.25, 0.12, bubble);
    p.z += cos(uTime * 0.17 + aSeed * 12.1) * 0.25;
    float depth = clamp((p.z + 30.0) / 35.0, 0.0, 1.0);
    p.xy += uPointer * depth * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.0 + bubble * 0.8) * uPixelRatio * (26.0 / -mv.z) * (1.0 + uStretch * depth);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
    vAlpha = twinkle * smoothstep(6.0, 3.0, p.z) * smoothstep(-32.0, -18.0, p.z);
    vKind = bubble + step(0.97, aSeed);
  }
`;

const fragment = /* glsl */ `
  uniform float uOpacity;
  uniform float uWater;
  uniform float uBufH;
  uniform float uAbyss;
  varying float vAlpha;
  varying float vKind;
  void main() {
    // only underwater
    if (gl_FragCoord.y / uBufH > uWater) discard;
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    vec3 col;
    float a;
    if (vKind > 1.5) {
      // bioluminescent mote, brighter the deeper we are
      a = pow(smoothstep(0.5, 0.0, d), 2.0) * (0.6 + uAbyss * 1.6);
      col = vec3(0.43, 0.94, 0.85);
    } else if (vKind > 0.5) {
      // bubble: bright rim, hollow centre, a little highlight
      float rim = smoothstep(0.5, 0.42, d) * smoothstep(0.25, 0.42, d);
      float hi = smoothstep(0.14, 0.0, length(c - vec2(-0.14, 0.14)));
      a = (rim * 0.7 + hi) * 0.9;
      col = vec3(0.8, 0.97, 0.95);
    } else {
      a = pow(smoothstep(0.5, 0.0, d), 1.6) * 0.75;
      col = vec3(0.7, 0.84, 0.86);
    }
    a *= vAlpha * uOpacity;
    gl_FragColor = vec4(col * a, a);
  }
`;

export function Particles() {
  const count = store.isMobile ? 600 : 1800;

  const { geometry, material } = useMemo(() => {
    const rnd = seeded(7);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * 34;
      pos[i * 3 + 1] = (rnd() - 0.5) * 24;
      pos[i * 3 + 2] = -30 + rnd() * 34;
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
        uWater: { value: 0 },
        uBufH: { value: 1 },
        uAbyss: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = sea.time;
    // scrolling down makes the water stream upward past the camera
    u.uTravel.value = store.depth * 6;
    (u.uPointer.value as THREE.Vector2).set(store.pointer.x, store.pointer.y);
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uStretch.value = Math.min(Math.abs(store.velocity) * 0.02, 1.2) + sea.storm;
    u.uOpacity.value = sea.intro * (1 + sea.gold * 0.6);
    u.uWater.value = store.depth + 1 - store.split;
    u.uBufH.value = state.gl.domElement.height;
    u.uAbyss.value = Math.min(1, Math.max(0, (store.depth + 1) / Math.max(store.pages, 1)));
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
