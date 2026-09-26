/**
 * The blade's mood through the page — one keyframe per section (order matches
 * SCENE_ORDER). Where the blade stands is not set here: that is solved from
 * the live layout in lib/bladeLayout.ts so it never covers content.
 *
 *   hero     sealed    — faint edge, closed rings
 *   about    stirring
 *   stack    activated — edge lit, rings open
 *   work     intensified
 *   oss      steady
 *   journey  steady
 *   contact  calm      — the world fades
 */

export type Keyframe = {
  energy: number;
  rings: number;
  /** overall scene brightness */
  light: number;
  /** particle field opacity */
  world: number;
};

const frames: Keyframe[] = [
  { energy: 0.22, rings: 0, light: 1, world: 1 },
  { energy: 0.45, rings: 0.35, light: 0.95, world: 0.9 },
  { energy: 0.85, rings: 1, light: 0.9, world: 0.8 },
  { energy: 1.0, rings: 1, light: 0.85, world: 0.85 },
  { energy: 0.7, rings: 0.8, light: 0.85, world: 0.7 },
  { energy: 0.55, rings: 0.6, light: 0.85, world: 0.6 },
  { energy: 0.35, rings: 0.45, light: 1, world: 0.3 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function sampleKeyframe(section: number, out: Keyframe): Keyframe {
  const s = Math.min(Math.max(section, 0), frames.length - 1);
  const i = Math.min(Math.floor(s), frames.length - 2);
  const t = smooth(s - i);
  const a = frames[i];
  const b = frames[i + 1];
  out.energy = mix(a.energy, b.energy, t);
  out.rings = mix(a.rings, b.rings, t);
  out.light = mix(a.light, b.light, t);
  out.world = mix(a.world, b.world, t);
  return out;
}

export const emptyKeyframe = (): Keyframe => ({ energy: 0, rings: 0, light: 1, world: 1 });
