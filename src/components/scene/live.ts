import * as THREE from "three";

/**
 * Smoothed scene state, written once per frame by the Director and read by
 * every scene object. Kept outside React so the render loop never allocates.
 */
export const live = {
  time: 0,
  energy: 0.2,
  rings: 0,
  light: 0,
  world: 0,
  red: 0, // 0 blue → 1 red (bankai)
  dark: 0, // blade darkening (bankai)
  surge: 0, // konami surge
  travel: 0,
  intro: 0,
  hover: 0,
  slash: 0,
  color: new THREE.Color("#4da3ff"),
};

export const COLORS = {
  blue: new THREE.Color("#4da3ff"),
  ice: new THREE.Color("#cfe6ff"),
  red: new THREE.Color("#ff1f3d"),
  silver: new THREE.Color("#c9ccd3"),
  crimson: new THREE.Color("#ff2338"),
  hot: new THREE.Color("#ffb3a0"),
};
