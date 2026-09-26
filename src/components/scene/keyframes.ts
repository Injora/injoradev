/**
 * The blade's arc through the page. One keyframe per section (order matches
 * SCENE_ORDER); the scene blends between neighbours by scroll position.
 *
 *   hero     sealed    — faint edge, closed rings
 *   about    stirring
 *   stack    activated — edge lit, rings open
 *   work     intensified
 *   oss      steady
 *   journey  steady
 *   contact  calm      — returns to the center, world fades
 */

export type Keyframe = {
  pos: [number, number, number];
  tiltX: number;
  tiltZ: number;
  scale: number;
  energy: number;
  rings: number;
  /** overall scene brightness, keeps text over the blade readable */
  light: number;
  /** particle field opacity */
  world: number;
};

const desktop: Keyframe[] = [
  { pos: [1.15, -0.05, -0.4], tiltX: 0.12, tiltZ: -0.58, scale: 0.8, energy: 0.22, rings: 0, light: 1, world: 1 },
  { pos: [0.38, 0.0, -1.4], tiltX: 0.05, tiltZ: -0.07, scale: 0.9, energy: 0.45, rings: 0.35, light: 0.9, world: 0.9 },
  { pos: [0.4, -0.9, -6.5], tiltX: 0.0, tiltZ: -1.5708, scale: 1.15, energy: 0.85, rings: 1, light: 0.38, world: 0.8 },
  { pos: [0.2, -2.05, -4.5], tiltX: 0.2, tiltZ: 1.5708, scale: 0.95, energy: 1.0, rings: 1, light: 0.45, world: 0.85 },
  { pos: [3.6, 0.2, -5.5], tiltX: 0.0, tiltZ: -0.32, scale: 0.8, energy: 0.7, rings: 0.8, light: 0.38, world: 0.7 },
  { pos: [-2.9, -0.05, -2.4], tiltX: 0.0, tiltZ: 0.22, scale: 0.72, energy: 0.55, rings: 0.6, light: 0.6, world: 0.6 },
  { pos: [0, 0.2, -0.6], tiltX: 0.08, tiltZ: -0.7854, scale: 0.78, energy: 0.35, rings: 0.45, light: 1, world: 0.3 },
];

const mobile: Keyframe[] = [
  { pos: [0.1, 0.55, -1.6], tiltX: 0.1, tiltZ: -0.5, scale: 0.62, energy: 0.22, rings: 0, light: 0.95, world: 1 },
  { pos: [0.6, 0.9, -3.2], tiltX: 0.05, tiltZ: -0.2, scale: 0.6, energy: 0.45, rings: 0.3, light: 0.45, world: 0.8 },
  { pos: [0, 0.0, -4.5], tiltX: 0, tiltZ: -1.5708, scale: 0.7, energy: 0.85, rings: 1, light: 0.35, world: 0.8 },
  { pos: [0, -1.4, -5.5], tiltX: 0.2, tiltZ: 1.5708, scale: 0.7, energy: 1, rings: 1, light: 0.3, world: 0.8 },
  { pos: [0.5, 1.2, -5], tiltX: 0, tiltZ: -0.3, scale: 0.6, energy: 0.7, rings: 0.8, light: 0.35, world: 0.7 },
  { pos: [-0.6, 0.8, -4], tiltX: 0, tiltZ: 0.2, scale: 0.6, energy: 0.55, rings: 0.6, light: 0.4, world: 0.6 },
  { pos: [0, 0.55, -1.8], tiltX: 0.08, tiltZ: -0.7854, scale: 0.6, energy: 0.35, rings: 0.45, light: 0.9, world: 0.3 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function sampleKeyframe(section: number, isMobile: boolean, out: Keyframe): Keyframe {
  const frames = isMobile ? mobile : desktop;
  const s = Math.min(Math.max(section, 0), frames.length - 1);
  const i = Math.min(Math.floor(s), frames.length - 2);
  const t = smooth(s - i);
  const a = frames[i];
  const b = frames[i + 1];
  out.pos[0] = mix(a.pos[0], b.pos[0], t);
  out.pos[1] = mix(a.pos[1], b.pos[1], t);
  out.pos[2] = mix(a.pos[2], b.pos[2], t);
  out.tiltX = mix(a.tiltX, b.tiltX, t);
  out.tiltZ = mix(a.tiltZ, b.tiltZ, t);
  out.scale = mix(a.scale, b.scale, t);
  out.energy = mix(a.energy, b.energy, t);
  out.rings = mix(a.rings, b.rings, t);
  out.light = mix(a.light, b.light, t);
  out.world = mix(a.world, b.world, t);
  return out;
}

export const emptyKeyframe = (): Keyframe => ({
  pos: [0, 0, 0],
  tiltX: 0,
  tiltZ: 0,
  scale: 1,
  energy: 0,
  rings: 0,
  light: 1,
  world: 1,
});
