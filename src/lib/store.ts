/**
 * A tiny mutable store shared between the DOM layer and the WebGL scene.
 * Values are written on scroll / pointer events and read inside the render
 * loop, so nothing here triggers React renders. `mode` changes are the only
 * thing components subscribe to.
 */

import type { BladeTarget } from "./bladeLayout";

export type Mode = "normal" | "bankai" | "surge";

type Listener = (mode: Mode) => void;

export const store = {
  /** normalized pointer, -1..1 (x right, y up) */
  pointer: { x: 0, y: 0 },
  /** 0..1 over the whole document */
  scroll: 0,
  /** px/frame-ish, smoothed — drives particle streaks */
  velocity: 0,
  /**
   * Continuous section position: 0 when the hero's center is at the viewport
   * center, 1 for the next section, etc. Fractions blend scene keyframes.
   */
  section: 0,
  /** intro progress 0..1, driven by the scene once it mounts */
  intro: 0,
  isMobile: false,
  reducedMotion: false,
  mode: "normal" as Mode,
  /** where the blade should stand, solved from the page layout (viewport px) */
  blade: { cx: 0, cy: 0, length: 0, angle: -0.6, ambient: true } as BladeTarget,
  bladeReady: false,
  /** timestamp (ms) of the last Getsuga slash, for the scene to react */
  slashAt: -1e9,
};

const listeners = new Set<Listener>();

export function setMode(mode: Mode) {
  store.mode = mode;
  listeners.forEach((l) => l(mode));
}

export function onMode(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Section order must match the `data-scene` attributes in the page. */
export const SCENE_ORDER = ["hero", "about", "stack", "work", "open-source", "journey", "contact"] as const;
