/**
 * A tiny mutable store shared between the DOM layer and the WebGL scene.
 * Values are written on scroll / pointer events and read inside the render
 * loop, so nothing here triggers React renders. `mode` changes are the only
 * thing components subscribe to.
 */

import type { BladeLane } from "./bladeLayout";

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
  /** the clear vertical lane the blade falls down, solved from the layout */
  lane: { cx: 0, clear: false } as BladeLane,
  laneReady: false,
  /** on-screen width of the falling blade (px), written by the scene for the solver */
  bladeWidthPx: 60,
  /**
   * Kyōka Suigetsu choreography, all scroll-driven (and so reversible):
   *   fall     0→1  hero … end of journey, the blade sinks through the page
   *   shatter  0→1  as the journey ends, it breaks into mirror shards
   *   reunite  0→1  at the very bottom, the shards rejoin — horizontally
   */
  fall: 0,
  shatter: 0,
  reunite: 0,
  /** viewport y (px) of the clear band where the blade reunites */
  finaleY: 0,
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
