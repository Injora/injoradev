import * as THREE from "three";

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

export const BLADE_LENGTH = 3.4;
const BASE_WIDTH = 0.3;
const SORI = 0.14; // curvature
const KISSAKI = 0.9; // where the tip begins
const RIDGE = 0.28; // shinogi position across the width

function frame(u: number) {
  const y = u * BLADE_LENGTH;
  const center = -SORI * u * u;
  let w = BASE_WIDTH * (1 - 0.28 * u);
  let spine = center - w / 2;
  let thick = 0.075 * (1 - 0.45 * u);
  if (u > KISSAKI) {
    const t = (u - KISSAKI) / (1 - KISSAKI);
    const f = Math.sqrt(Math.max(0, 1 - t * t));
    spine += w * 0.22 * t * t;
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

export function createBladeGeometry(segU = 140, segV = 10) {
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

/** Guard (tsuba) with two crescent cut-outs — a quiet nod to the Getsuga. */
export function createGuardGeometry() {
  const r = 0.34;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, 0, Math.PI * 2, false);

  // Region inside circle C1 and outside a right-shifted circle C2.
  const crescent = (dir: 1 | -1) => {
    const cx = 0.19;
    const cr = 0.095;
    const a = 0.06;
    const c2 = cx + a;
    const R = Math.sqrt(a * a + cr * cr);
    const n = 28;
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= n; i++) {
      const ang = Math.PI / 2 + (Math.PI * i) / n;
      pts.push(new THREE.Vector2(cx + Math.cos(ang) * cr, Math.sin(ang) * cr));
    }
    const from = Math.atan2(-cr, -a) + Math.PI * 2;
    const to = Math.atan2(cr, -a);
    for (let i = 1; i < n; i++) {
      const ang = from + (to - from) * (i / n);
      pts.push(new THREE.Vector2(c2 + Math.cos(ang) * R, Math.sin(ang) * R));
    }
    if (dir === -1) pts.forEach((p) => p.set(-p.x, p.y));
    return new THREE.Path(pts);
  };
  shape.holes.push(crescent(1), crescent(-1));

  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 48,
  });
  g.translate(0, 0, -0.025);
  g.rotateX(-Math.PI / 2);
  return g;
}
