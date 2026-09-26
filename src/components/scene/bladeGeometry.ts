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

export const BLADE_LENGTH = 3.7;
const BASE_WIDTH = 0.25;
const SORI = 0.2; // curvature
const KISSAKI = 0.9; // where the point begins
const RIDGE = 0.3; // shinogi position across the width

function frame(u: number) {
  const y = u * BLADE_LENGTH;
  const center = -SORI * u * u;
  let w = BASE_WIDTH * (1 - 0.3 * u);
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

export function createBladeGeometry(segU = 180, segV = 10) {
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

/** Guard: a plain oval tsuba with a raised rim. */
export function createGuardGeometry() {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, 0.3, 0.26, 0, Math.PI * 2, false, 0);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.016,
    bevelSegments: 4,
    curveSegments: 64,
  });
  g.translate(0, 0, -0.025);
  g.rotateX(-Math.PI / 2);
  return g;
}

/**
 * Kyōka Suigetsu: split the blade into jagged mirror shards.
 *
 * Triangles are assigned to shards by where they sit on the blade (u, v),
 * with cracks that wander diagonally so pieces look broken, not sliced. Each
 * vertex carries its shard's centre, a flight direction and a seed; the
 * vertex shader does the rest, so shattering costs nothing on the CPU.
 */
export function shatterGeometry(indexed: THREE.BufferGeometry, rows = 15) {
  const g = indexed.toNonIndexed();
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const edge = g.getAttribute("aEdge") as THREE.BufferAttribute;
  const len = g.getAttribute("aLen") as THREE.BufferAttribute;
  const triCount = pos.count / 3;

  const crack = (i: number, v: number) => i / rows + 0.028 * Math.sin(i * 12.9 + v * 5.3) + (v - 0.5) * 0.05 * (i % 2 ? 1 : -1);
  const shardOf = (u: number, v: number) => {
    let row = 0;
    while (row < rows && u > crack(row + 1, v)) row++;
    const split = 0.5 + 0.12 * Math.sin(u * 37 + row);
    return row * 2 + (v > split ? 1 : 0);
  };

  const ids = new Int32Array(triCount);
  const count = rows * 2 + 2;
  const sums = Array.from({ length: count }, () => new THREE.Vector3());
  const n = new Float32Array(count);
  const a = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    let u = 0;
    let v = 0;
    for (let k = 0; k < 3; k++) {
      u += len.getX(t * 3 + k) / 3;
      v += (1 - edge.getX(t * 3 + k)) / 3;
    }
    const id = shardOf(u, v);
    ids[t] = id;
    for (let k = 0; k < 3; k++) {
      a.fromBufferAttribute(pos, t * 3 + k);
      sums[id].add(a);
    }
    n[id] += 3;
  }
  sums.forEach((c, i) => n[i] && c.multiplyScalar(1 / n[i]));

  // deterministic per-shard flight
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dirs = sums.map((c) => {
    const out = new THREE.Vector3((rnd() - 0.5) * 2 + Math.sign(c.x || 1) * 0.6, (rnd() - 0.5) * 1.4, (rnd() - 0.3) * 1.6);
    return out.normalize();
  });
  const seeds = sums.map(() => rnd());

  const center = new Float32Array(pos.count * 3);
  const dir = new Float32Array(pos.count * 3);
  const sd = new Float32Array(pos.count);
  for (let t = 0; t < triCount; t++) {
    const id = ids[t];
    for (let k = 0; k < 3; k++) {
      const i = t * 3 + k;
      center.set([sums[id].x, sums[id].y, sums[id].z], i * 3);
      dir.set([dirs[id].x, dirs[id].y, dirs[id].z], i * 3);
      sd[i] = seeds[id];
    }
  }
  g.setAttribute("aShardCenter", new THREE.BufferAttribute(center, 3));
  g.setAttribute("aShardDir", new THREE.BufferAttribute(dir, 3));
  g.setAttribute("aShardSeed", new THREE.BufferAttribute(sd, 1));
  // normals carried over from the indexed mesh stay smooth across cracks
  return g;
}
