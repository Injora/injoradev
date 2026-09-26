/**
 * Layout-aware blade placement.
 *
 * Rather than hardcoding where the blade sits in each section, we read the
 * page: visible content is rasterised onto a coarse occupancy grid of the
 * viewport, the maximal empty rectangles are enumerated, and the blade takes
 * whichever pose (horizontal / vertical / diagonal) lets it be largest without
 * covering anything. If nothing fits, it retreats into the background.
 *
 * Output is in viewport pixels; the scene converts it to world space every
 * frame, so resizes and camera changes are handled for free.
 */

export type BladeTarget = {
  /** composition score used to compare candidate spots */
  score?: number;
  cx: number;
  cy: number;
  /** blade length in px */
  length: number;
  /** rotation about the view axis; 0 = tip up, −π/2 = tip right */
  angle: number;
  ambient: boolean;
};

const COLS = 36;
const ROWS = 20;
const PAD = 14;
/** silhouette thickness ÷ length (blade + curve + guard + hanging chain) */
const THICKNESS = 0.2;
/** the floating nav owns the top of the viewport */
const NAV_BAND = 96;

const OCCLUDERS = [
  "main h1:not([data-blade='ignore'])",
  "main h2",
  "main h3",
  "main p",
  "main li",
  "main a",
  "main button",
  "main pre",
  "main figure",
  "main [data-occlude]",
  "header nav",
].join(",");

type Rect = { c0: number; r0: number; c1: number; r1: number }; // inclusive cells

let grid = new Uint8Array(COLS * ROWS);
let current: (BladeTarget & { rect: Rect | null }) | null = null;

function rasterise(vw: number, vh: number) {
  grid = new Uint8Array(COLS * ROWS);
  const cw = vw / COLS;
  const ch = vh / ROWS;
  const navRows = Math.ceil(NAV_BAND / ch);
  for (let y = 0; y < navRows; y++) for (let x = 0; x < COLS; x++) grid[y * COLS + x] = 1;
  const els = document.querySelectorAll<HTMLElement>(OCCLUDERS);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    const c0 = Math.max(0, Math.floor((r.left - PAD) / cw));
    const c1 = Math.min(COLS - 1, Math.floor((r.right + PAD) / cw));
    const r0 = Math.max(0, Math.floor((r.top - PAD) / ch));
    const r1 = Math.min(ROWS - 1, Math.floor((r.bottom + PAD) / ch));
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) grid[y * COLS + x] = 1;
  }
}

/** Largest blade that fits a w×h box, and the pose that achieves it. */
function fit(w: number, h: number): { length: number; angle: number } {
  const horizontal = Math.min(w, h / THICKNESS);
  const vertical = Math.min(h, w / THICKNESS);
  // a diagonal needs a roughly square-ish box to be worth it
  const lo = Math.min(w, h);
  const hi = Math.max(w, h);
  const diagonal = lo > hi * 0.35 ? Math.hypot(w, h) * 0.86 - lo * THICKNESS : 0;
  // Slight preference for the diagonal — it's the most cinematic silhouette.
  if (diagonal * 1.05 >= horizontal && diagonal * 1.05 >= vertical) return { length: diagonal, angle: -Math.atan2(w, h) };
  if (horizontal >= vertical) return { length: horizontal, angle: -Math.PI / 2 };
  return { length: vertical, angle: -0.06 };
}

function rectFree(rect: Rect) {
  let blocked = 0;
  let total = 0;
  for (let y = rect.r0; y <= rect.r1; y++)
    for (let x = rect.c0; x <= rect.c1; x++) {
      total++;
      blocked += grid[y * COLS + x];
    }
  return 1 - blocked / Math.max(1, total);
}

function toTarget(rect: Rect, vw: number, vh: number): BladeTarget & { rect: Rect } {
  const cw = vw / COLS;
  const ch = vh / ROWS;
  const w = (rect.c1 - rect.c0 + 1) * cw;
  const h = (rect.r1 - rect.r0 + 1) * ch;
  const { length, angle } = fit(w, h);
  const cx = (rect.c0 * cw + (rect.c1 + 1) * cw) / 2;
  const cy = (rect.r0 * ch + (rect.r1 + 1) * ch) / 2;
  const capped = Math.min(length, vh * 1.15);
  // Composition: a blade with room to breathe near the middle of the frame
  // beats a longer one squeezed into a letterbox at the edge.
  const centred = 1 - 0.45 * Math.abs(cy - vh / 2) / (vh / 2);
  const breathing = Math.min(1, h / (vh * 0.3));
  const score = capped * centred * (0.55 + 0.45 * breathing);
  return { rect, cx, cy, length: capped, angle, ambient: false, score };
}

/** Enumerate maximal empty rectangles (histogram method) and keep the best fit. */
function bestRect(vw: number, vh: number) {
  const heights = new Array<number>(COLS).fill(0);
  let best: (BladeTarget & { rect: Rect }) | null = null;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) heights[c] = grid[r * COLS + c] ? 0 : heights[c] + 1;
    const stack: number[] = [];
    for (let c = 0; c <= COLS; c++) {
      const h = c === COLS ? 0 : heights[c];
      while (stack.length && heights[stack[stack.length - 1]] >= h) {
        const top = stack.pop()!;
        const height = heights[top];
        if (height === 0) continue;
        const left = stack.length ? stack[stack.length - 1] + 1 : 0;
        const cand = toTarget({ c0: left, c1: c - 1, r0: r - height + 1, r1: r }, vw, vh);
        if (!best || cand.score! > best.score!) best = cand;
      }
      stack.push(c);
    }
  }
  return best;
}

/**
 * Art direction wins over the solver: a visible element marked
 * `data-blade-slot` pins the blade to it (optionally `data-blade-pose`).
 */
function slotTarget(vw: number, vh: number): BladeTarget | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-blade-slot]")) {
    const r = el.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.max(1, r.height);
    if (r.width < 2 || visible < 0.55) continue;
    const pose = el.dataset.bladePose;
    const diagonal = { length: Math.hypot(r.width, r.height) * 0.9, angle: -Math.atan2(r.width, r.height) };
    const f = pose === "diagonal" ? diagonal : fit(r.width, r.height);
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, length: Math.min(f.length, vh * 1.15), angle: f.angle, ambient: false };
  }
  return null;
}

export function computeBladeTarget(vw: number, vh: number): BladeTarget {
  const slot = slotTarget(vw, vh);
  if (slot) {
    current = { ...slot, rect: null };
    return slot;
  }
  rasterise(vw, vh);
  const best = bestRect(vw, vh);
  const minScore = Math.min(vw, vh) * 0.4;

  // Hysteresis: stay put unless our spot gets covered or a much better one opens up.
  if (current?.rect && !current.ambient) {
    const stillFree = rectFree(current.rect) > 0.94;
    const kept = toTarget(current.rect, vw, vh);
    if (stillFree && (!best || best.score! < kept.score! * 1.3) && kept.score! >= minScore) {
      current = kept;
      return current;
    }
  }

  if (best && best.score! >= minScore) {
    current = best;
    return current;
  }

  // Nowhere to stand: retreat into the background, dimmed by the scene.
  current = { rect: null, cx: vw / 2, cy: vh / 2, length: vh * 0.95, angle: -0.6, ambient: true };
  return current;
}

/** Debug overlay: add ?blade-debug to the URL to see the occupancy grid. */
export function drawDebug(ctx: CanvasRenderingContext2D, vw: number, vh: number, t: BladeTarget) {
  const cw = vw / COLS;
  const ch = vh / ROWS;
  ctx.clearRect(0, 0, vw, vh);
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (grid[y * COLS + x]) {
        ctx.fillStyle = "rgba(226,29,53,0.12)";
        ctx.fillRect(x * cw, y * ch, cw - 1, ch - 1);
      }
  if (current?.rect) {
    const r = current.rect;
    ctx.strokeStyle = "rgba(77,163,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(r.c0 * cw, r.r0 * ch, (r.c1 - r.c0 + 1) * cw, (r.r1 - r.r0 + 1) * ch);
  }
  ctx.save();
  ctx.translate(t.cx, t.cy);
  ctx.rotate(-t.angle);
  ctx.strokeStyle = t.ambient ? "rgba(255,255,255,0.4)" : "#cfe6ff";
  ctx.beginPath();
  ctx.moveTo(0, t.length / 2);
  ctx.lineTo(0, -t.length / 2);
  ctx.stroke();
  ctx.restore();
}
