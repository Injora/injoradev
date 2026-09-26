import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Procedural blade geometry.
 *
 * The blade is built as parametric patches rather than an extruded shape so
 * the cross-section is real: a thick spine, a crisp ridge line (shinogi) and
 * a wedge that thins to the cutting edge. That's what makes reflections slide
 * across it like forged metal instead of a flat cut-out.
 *
 * u runs base → tip (0..1), v runs spine → edge (0..1).
 * Custom attributes: aEdge (0 at the cutting edge) and aLen (u) drive the
 * energy line in the material shader.
 */

export const BLADE_LENGTH = 3.6;
const SORI = 0.3; // curvature
const KISSAKI = 0.86; // where the sweeping point begins
const RIDGE = 0.3; // shinogi position across the width
const NOTCH_AT = 0.785; // stepped notch on the spine near the tip
const NOTCH_DEPTH = 0.1;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function frame(u: number) {
  const y = u * BLADE_LENGTH;
  const center = -SORI * u * u;
  // widens slightly toward the tip, like a cleaver-weighted blade
  let w = 0.31 + 0.06 * u;
  let spine = center - w / 2;
  // the step: spine jumps toward the edge, then runs on to the point
  const notch = smoothstep(NOTCH_AT, NOTCH_AT + 0.006, u) * NOTCH_DEPTH;
  spine += notch;
  w -= notch;
  let thick = 0.08 * (1 - 0.4 * u) * (1 - notch * 2);
  if (u > KISSAKI) {
    const t = (u - KISSAKI) / (1 - KISSAKI);
    const f = Math.sqrt(Math.max(0, 1 - t * t));
    spine += w * 0.3 * t * t;
    w *= f;
    thick *= 1 - 0.75 * t;
  }
  return { y, spine, w, thick };
}

function halfThickness(v: number, thick: number) {
  if (v <= RIDGE) return (thick / 2) * (0.7 + 0.3 * (v / RIDGE));
  const t = (v - RIDGE) / (1 - RIDGE);
  return (thick / 2) * (1 - 0.94 * Math.pow(t, 0.85));
}

export function createBladeGeometry(segU = 260, segV = 10) {
  const pos: number[] = [];
  const uv: number[] = [];
  const edge: number[] = [];
  const len: number[] = [];
  const idx: number[] = [];

  const vertex = (u: number, v: number, side: number) => {
    const f = frame(u);
    const x = f.spine + f.w * v;
    const z = side * halfThickness(v, f.thick);
    pos.push(x, f.y, z);
    uv.push(u, v);
    edge.push(1 - v);
    len.push(u);
  };

  // Flat patch across v ∈ [v0, v1] on one side of the blade.
  const patch = (v0: number, v1: number, side: 1 | -1) => {
    const start = pos.length / 3;
    for (let i = 0; i <= segU; i++) {
      for (let j = 0; j <= segV; j++) vertex(i / segU, v0 + ((v1 - v0) * j) / segV, side);
    }
    const row = segV + 1;
    for (let i = 0; i < segU; i++) {
      for (let j = 0; j < segV; j++) {
        const a = start + i * row + j;
        const b = a + row;
        const c = a + 1;
        const d = b + 1;
        if (side === 1) idx.push(a, c, b, c, d, b);
        else idx.push(a, b, c, c, b, d);
      }
    }
  };

  // Strip closing the blade along v = const (spine or edge).
  const strip = (v: number, outward: 1 | -1) => {
    const start = pos.length / 3;
    for (let i = 0; i <= segU; i++) {
      vertex(i / segU, v, -1);
      vertex(i / segU, v, 1);
    }
    for (let i = 0; i < segU; i++) {
      const a = start + i * 2; // bottom
      const c = a + 1; // top
      const b = a + 2;
      const d = a + 3;
      if (outward === -1) idx.push(a, c, b, c, d, b);
      else idx.push(a, b, c, c, b, d);
    }
  };

  patch(0, RIDGE, 1);
  patch(RIDGE, 1, 1);
  patch(0, RIDGE, -1);
  patch(RIDGE, 1, -1);
  strip(0, -1);
  strip(1, 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aEdge", new THREE.Float32BufferAttribute(edge, 1));
  g.setAttribute("aLen", new THREE.Float32BufferAttribute(len, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A ribbon hugging the cutting edge, used for the additive energy glow. */
export function createEdgeRibbon(seg = 120, width = 0.32) {
  const pos: number[] = [];
  const side: number[] = [];
  const len: number[] = [];
  const idx: number[] = [];
  const edgePoint = (u: number) => {
    const f = frame(u);
    return new THREE.Vector2(f.spine + f.w, f.y);
  };
  for (let i = 0; i <= seg; i++) {
    const u = (i / seg) * 0.995;
    const p = edgePoint(u);
    const q = edgePoint(Math.min(1, u + 0.01));
    const t = q.clone().sub(p).normalize();
    const n = new THREE.Vector2(t.y, -t.x); // points away from the spine
    for (const s of [0, 1]) {
      const o = p.clone().addScaledVector(n, -0.01 + s * width);
      pos.push(o.x, o.y, 0);
      side.push(s);
      len.push(u);
    }
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute("aLen", new THREE.Float32BufferAttribute(len, 1));
  g.setIndex(idx);
  return g;
}

/**
 * Guard: a small hub with four hooked arms turning the same way — an
 * original take on the swirling guard of the reference blade.
 */
export function createGuardGeometry() {
  const opts = {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 32,
  };
  const parts: THREE.BufferGeometry[] = [];

  const hub = new THREE.Shape();
  hub.absarc(0, 0, 0.1, 0, Math.PI * 2, false);
  parts.push(new THREE.ExtrudeGeometry(hub, opts));

  const k = 0.78;
  const arm = [
    [0.07, -0.028],
    [0.19, -0.028],
    [0.19, 0.085],
    [0.235, 0.15],
    [0.15, 0.105],
    [0.15, 0.028],
    [0.07, 0.028],
  ].map(([x, y]) => new THREE.Vector2(x * k, y * k));
  for (let i = 0; i < 4; i++) {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(arm), opts);
    g.rotateZ((i * Math.PI) / 2);
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  merged.translate(0, 0, -0.0225);
  merged.rotateX(-Math.PI / 2);
  merged.computeVertexNormals();
  return merged;
}
