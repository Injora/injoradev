/**
 * A tiny mutable store shared between the DOM layer and the WebGL ocean.
 * Written on scroll / pointer events and read inside the render loop, so
 * nothing here triggers React renders. Only `mode` changes are subscribed to.
 */

export type Mode = "normal" | "storm" | "treasure";

type Listener = (mode: Mode) => void;

export const store = {
  /** normalized pointer, -1..1 (x right, y up) */
  pointer: { x: 0, y: 0 },
  /** scrollY in viewport heights */
  depth: 0,
  /** document height in viewport heights */
  pages: 1,
  /** document y of the horizon (hero name baseline), in viewport heights */
  horizon: 0.55,
  /** document y where the camera goes under (hero bottom), in viewport heights */
  split: 1,
  /** smoothed px/frame */
  velocity: 0,
  isMobile: false,
  reducedMotion: false,
  mode: "normal" as Mode,
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
