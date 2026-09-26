"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";

const ROUTE = "M40 250 C 120 250, 140 170, 210 160 S 330 90, 380 70 S 440 70, 470 60";
const STOPS = [
  { x: 40, y: 250, label: "Hostel stop" },
  { x: 210, y: 160, label: "Hostel stop" },
  { x: 470, y: 60, label: "Campus" },
];
const QUORUM = 10;

export function ShuttleVisual({ accent }: { accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });
  const [pending, setPending] = useState(3);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setPending((p) => (p >= QUORUM + 2 ? 3 : p + 1)), 650);
    return () => clearInterval(id);
  }, [inView]);

  const dispatched = pending >= QUORUM;

  return (
    <div ref={ref} className="h-full">
      <Frame title="shuttle-tracker / live" accent={accent}>
        <div className="relative h-full">
          <svg viewBox="0 0 540 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,0.045)" />
              </pattern>
            </defs>
            <rect width="540" height="300" fill="url(#grid)" />
            {/* secondary roads */}
            <path d="M0 120 L540 200 M150 0 L260 300 M330 0 L420 300" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
            <path d={ROUTE} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <motion.path
              d={ROUTE}
              stroke={accent}
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 8"
              animate={inView ? { strokeDashoffset: [0, -120] } : undefined}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            {STOPS.map((s, i) => (
              <g key={i}>
                <motion.circle
                  cx={s.x}
                  cy={s.y}
                  r="26"
                  fill={`${accent}10`}
                  stroke={accent}
                  strokeOpacity="0.4"
                  strokeDasharray="3 4"
                  animate={inView ? { r: [24, 30, 24] } : undefined}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.6 }}
                />
                <circle cx={s.x} cy={s.y} r="4" fill="#f2f3f6" />
                <text x={i === 2 ? s.x - 12 : s.x + 12} y={s.y - 12} textAnchor={i === 2 ? "end" : "start"} fill="#8a8e98" fontSize="10" fontFamily="var(--font-mono)">
                  {s.label}
                </text>
              </g>
            ))}
            {/* the shuttle */}
            <g>
              <circle r="7" fill={accent}>
                {inView && <animateMotion dur="9s" repeatCount="indefinite" path={ROUTE} />}
              </circle>
              <circle r="16" fill={accent} opacity="0.18">
                {inView && <animateMotion dur="9s" repeatCount="indefinite" path={ROUTE} />}
              </circle>
            </g>
          </svg>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
            <div className="glass rounded-xl px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Pickup requests</p>
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: QUORUM }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="h-3 w-1.5 rounded-sm"
                    animate={{ backgroundColor: i < pending ? accent : "rgba(255,255,255,0.1)" }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
                <span className="ml-2 font-mono text-[11px] text-snow">
                  {Math.min(pending, QUORUM)}/{QUORUM}
                </span>
              </div>
              <motion.p className="mt-2 font-mono text-[10.5px]" animate={{ color: dispatched ? "#f2f3f6" : "#5d616b" }}>
                {dispatched ? "quorum reached → dispatch alert" : "st_distance geofence ✓"}
              </motion.p>
            </div>
            <div className="glass flex gap-1 rounded-full p-1 font-mono text-[10px] uppercase tracking-[0.14em]">
              {["Student", "Driver", "Admin"].map((r, i) => (
                <span key={r} className={`rounded-full px-3 py-1.5 ${i === 1 ? "bg-white/10 text-snow" : "text-mist"}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Frame>
    </div>
  );
}
