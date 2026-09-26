"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop-only cursor: a small dot plus a trailing ring with inertia.
 * Elements opt in to states with `data-cursor="link" | "view"` and an
 * optional `data-cursor-label`.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<{ kind: "default" | "link" | "view"; label: string }>({ kind: "default", label: "" });
  const [pressed, setPressed] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    if (!mq.matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- enabling after a media query check
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pos = { x: -100, y: -100 };
    const lag = { x: -100, y: -100 };
    let raf = 0;

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      setHidden(false);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button, [role='button'], input, textarea");
      if (!el) return setState({ kind: "default", label: "" });
      const kind = (el.dataset.cursor as "link" | "view") || "link";
      setState({ kind, label: el.dataset.cursorLabel ?? "" });
    };
    const leave = () => setHidden(true);
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    const tick = () => {
      const k = reduce ? 1 : 0.16;
      lag.x += (pos.x - lag.x) * k;
      lag.y += (pos.y - lag.y) * k;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  if (!enabled) return null;

  const size = state.kind === "view" ? 116 : state.kind === "link" ? 44 : 30;

  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 z-[90] transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}>
      <div ref={ring} className="absolute left-0 top-0 will-change-transform">
        <div
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[width,height,background-color,border-color] duration-500 ease-[var(--ease-cinema)]"
          style={{
            width: size,
            height: size,
            scale: pressed ? 0.85 : 1,
            transitionProperty: "width,height,background-color,border-color,scale",
            borderColor: state.kind === "default" ? "rgb(255 255 255 / 0.22)" : "rgb(207 230 255 / 0.55)",
            backgroundColor: state.kind === "view" ? "rgb(242 243 246 / 0.95)" : state.kind === "link" ? "rgb(77 163 255 / 0.08)" : "transparent",
          }}
        >
          <span
            className={`whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-black transition-opacity duration-300 ${
              state.kind === "view" ? "opacity-100 delay-150" : "opacity-0"
            }`}
          >
            {state.label || "View"} →
          </span>
        </div>
      </div>
      <div ref={dot} className="absolute left-0 top-0 will-change-transform">
        <div
          className={`h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-snow transition-opacity duration-200 ${
            state.kind === "view" ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>
    </div>
  );
}
