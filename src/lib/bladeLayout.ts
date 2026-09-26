/**
 * Layout-aware lane for the falling blade.
 *
 * The blade falls vertically through the page. To keep it off the content,
 * visible elements are rasterised onto a coarse occupancy grid of the
 * viewport and we pick the column band where a vertical blade has the longest
 * clear run. If no lane is clear enough the blade keeps falling but fades to a
 * background ghost. Sections can art-direct with `data-blade-slot`.
 */

export type BladeLane = {
  /** lane centre, viewport px */
  cx: number;
  /** false → no clear lane; the scene ghosts the blade */
  clear: boolean;
  score?: number;
};

const COLS = 48;
const ROWS = 24;
const PAD = 10;
const NAV_BAND = 90;

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
].join(",");

let grid = new Uint8Array(COLS * ROWS);
let current: (BladeLane & { c0: number; c1: number }) | null = null;

function rasterise(vw: number, vh: number) {
  grid = new Uint8Array(COLS * ROWS);
  const cw = vw / COLS;
  const ch = vh / ROWS;
  const navRows = Math.ceil(NAV_BAND / ch);
  for (let y = 0; y < navRows; y++) for (let x = 0; x < COLS; x++) grid[y * COLS + x] = 1;
  for (const el of document.querySelectorAll<HTMLElement>(OCCLUDERS)) {
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

/** Longest run of fully clear rows across columns c0..c1. */
function clearRun(c0: number, c1: number) {
  let best = 0;
  let run = 0;
  for (let y = 0; y < ROWS; y++) {
    let free = true;
    for (let x = c0; x <= c1 && free; x++) if (grid[y * COLS + x]) free = false;
    run = free ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best / ROWS;
}

function slotLane(vh: number): BladeLane | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-blade-slot]")) {
    const r = el.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.max(1, r.height);
    if (r.width > 2 && visible > 0.55) return { cx: r.left + r.width / 2, clear: true };
  }
  return null;
}

/**
 * @param bladeWidth on-screen width of the vertical blade (px)
 * @param minRun     fraction of the viewport height that must be clear
 */
export function computeLane(vw: number, vh: number, bladeWidth: number, minRun = 0.55): BladeLane {
  const slot = slotLane(vh);
  if (slot) {
    current = null;
    return slot;
  }
  rasterise(vw, vh);
  const cw = vw / COLS;
  const band = Math.max(1, Math.ceil(bladeWidth / cw) + 1);

  let best: (BladeLane & { c0: number; c1: number }) | null = null;
  for (let c0 = 1; c0 + band < COLS - 1; c0++) {
    const c1 = c0 + band - 1;
    const run = clearRun(c0, c1);
    const cx = ((c0 + c1 + 1) / 2) * cw;
    // prefer longer clear runs; mild pull away from the extreme edges
    const edge = Math.min(cx, vw - cx) / (vw / 2);
    const score = run * (0.85 + 0.15 * Math.min(1, edge * 3));
    if (!best || score > best.score!) best = { cx, clear: run >= minRun, score, c0, c1 };
  }

  // Hysteresis: keep our lane while it stays clear and nothing much better appears.
  if (current) {
    const run = clearRun(current.c0, current.c1);
    if (run >= minRun && (!best || best.score! < run * 1.25)) {
      current = { ...current, clear: true, score: run };
      return current;
    }
  }
  if (best?.clear) {
    current = best;
    return best;
  }
  // No clear lane: stay where we were (continuity of the fall), ghosted.
  const cx = current?.cx ?? vw * 0.72;
  current = null;
  return { cx, clear: false };
}

/**
 * Finale: the tallest clear horizontal band across the middle of the screen,
 * where the shards reunite as a horizontal blade. Returns its centre (px).
 */
export function computeBand(vw: number, vh: number): number {
  rasterise(vw, vh);
  const c0 = Math.floor(COLS * 0.1);
  const c1 = Math.ceil(COLS * 0.9);
  let best = { run: 0, end: -1 };
  let run = 0;
  for (let y = 0; y < ROWS; y++) {
    let free = true;
    for (let x = c0; x < c1 && free; x++) if (grid[y * COLS + x]) free = false;
    run = free ? run + 1 : 0;
    if (run > best.run) best = { run, end: y };
  }
  if (best.run < 2) return vh * 0.44;
  const ch = vh / ROWS;
  return (best.end - best.run / 2 + 1) * ch;
}

/** Debug overlay: add ?blade-debug to the URL. */
export function drawDebug(ctx: CanvasRenderingContext2D, vw: number, vh: number, lane: BladeLane) {
  const cw = vw / COLS;
  const ch = vh / ROWS;
  ctx.clearRect(0, 0, vw, vh);
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (grid[y * COLS + x]) {
        ctx.fillStyle = "rgba(226,29,53,0.12)";
        ctx.fillRect(x * cw, y * ch, cw - 1, ch - 1);
      }
  ctx.strokeStyle = lane.clear ? "#4da3ff" : "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lane.cx, 0);
  ctx.lineTo(lane.cx, vh);
  ctx.stroke();
}
