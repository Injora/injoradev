"use client";

import { useEffect, useRef, useState } from "react";
import { scrollToId } from "@/lib/scroll";

const STOPS = [
  { id: "top", label: "Surface" },
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "work", label: "Work" },
  { id: "open-source", label: "Open source" },
  { id: "journey", label: "Journey" },
  { id: "contact", label: "Contact" },
];

const MAX_METRES = 3800;

/** Desktop scroll position as an ocean depth reading; each stop jumps to its section. */
export function DepthGauge() {
  const marker = useRef<HTMLDivElement>(null);
  const reading = useRef<HTMLSpanElement>(null);
  const [stops, setStops] = useState<number[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      setStops(
        STOPS.map(({ id }) => {
          const el = document.getElementById(id);
          return el ? Math.min(1, (el.getBoundingClientRect().top + scrollY) / max) : 0;
        })
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    let raf = 0;
    let last = -1;
    const tick = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const p = Math.min(1, Math.max(0, scrollY / max));
      if (p !== last) {
        last = p;
        if (marker.current) marker.current.style.transform = `translateY(${p * 100}%)`;
        if (reading.current) reading.current.textContent = `${Math.round(p * MAX_METRES).toLocaleString("en-US")} m`;
        const ids = STOPS.map(({ id }) => document.getElementById(id));
        const mid = scrollY + innerHeight * 0.45;
        let a = 0;
        ids.forEach((el, i) => el && el.getBoundingClientRect().top + scrollY <= mid && (a = i));
        setActive(a);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <nav aria-label="Page depth" className="group/gauge pointer-events-none fixed bottom-[14vh] right-[max(1rem,calc(var(--gutter)*0.45))] top-[18vh] z-40 hidden w-28 lg:block">
      <div className="absolute bottom-0 right-0 top-0 w-px bg-gradient-to-b from-spray/40 via-line-strong to-glow/30" />
      {stops.map((top, i) => (
        <button
          key={STOPS[i].id}
          onClick={() => scrollToId(STOPS[i].id)}
          className="group pointer-events-auto absolute right-0 flex -translate-y-1/2 items-center gap-2 py-1"
          style={{ top: `${top * 100}%` }}
          aria-current={active === i ? "location" : undefined}
        >
          <span
            className={`whitespace-nowrap text-[11px] font-semibold transition-all duration-500 ease-[var(--ease-cinema)] ${
              active === i ? "text-glow" : "text-mist"
            } translate-x-1 opacity-0 group-hover/gauge:translate-x-0 group-hover/gauge:opacity-100 group-focus-visible:opacity-100`}
          >
            {STOPS[i].label}
          </span>
          <span className={`block h-px transition-all duration-500 ${active === i ? "w-4 bg-glow" : "w-2 bg-spray/40 group-hover:w-3"}`} />
        </button>
      ))}
      <div ref={marker} className="absolute inset-x-0 top-0 h-full will-change-transform">
        <div className="absolute right-[-4px] top-0 -translate-y-1/2">
          <span className="relative block h-[9px] w-[9px] rounded-full border border-glow bg-abyss shadow-[0_0_12px_rgb(111_240_216/0.7)]">
            <span className="absolute inset-0 animate-ping rounded-full bg-glow/40" />
          </span>
          <span ref={reading} className="absolute right-0 top-full mt-1.5 whitespace-nowrap font-mono text-[10px] tabular-nums text-glow/80" aria-hidden>
            0 m
          </span>
        </div>
      </div>
    </nav>
  );
}
