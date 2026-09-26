"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";

// Dimension weights are the real defaults from RecomOS src/lib/constants.ts.
const DIMENSIONS = [
  { k: "User fit", w: 30 },
  { k: "Beginner-friendliness", w: 20 },
  { k: "Project availability", w: 15 },
  { k: "Community activity", w: 15 },
  { k: "GSoC history", w: 10 },
  { k: "Maintainer responsiveness", w: 5 },
  { k: "Competition advantage", w: 5 },
];

// Orgs from the RecomOS seed catalog; ordering and bars here are illustrative.
const ORGS = ["Sugar Labs", "CircuitVerse.org", "AOSSIE", "omegaUp", "Mozilla"];

export function CompassVisual({ accent }: { accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setPhase((p) => (p + 1) % 3), 3200);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <div ref={ref} className="h-full">
      <Frame title="opensource-compass / results" accent={accent} note="Interface study · illustrative">
        <div className="grid h-full grid-cols-[1.1fr_1fr] gap-4 p-5">
          <div className="flex flex-col">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Top 5 · evidence-backed</p>
            <ol className="mt-3 flex-1 space-y-2">
              {ORGS.map((o, i) => (
                <motion.li
                  key={o}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  animate={{ borderColor: phase === 0 && i === 0 ? `${accent}66` : "rgba(255,255,255,0.06)" }}
                >
                  <span className="font-mono text-[11px] text-dim">0{i + 1}</span>
                  <span className="flex-1 truncate text-[13px] text-snow">{o}</span>
                  <span className="relative h-1 w-16 overflow-hidden rounded-full bg-white/10">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: accent }}
                      initial={{ width: 0 }}
                      animate={{ width: inView ? `${88 - i * 11 + (phase === 1 ? 3 : 0)}%` : 0 }}
                      transition={{ duration: 1.4, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </span>
                </motion.li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-mist">↗ source linked</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-mist">timestamped</span>
              <span className="rounded-full border border-ember/40 px-2 py-0.5 text-ember/90">Unknown / insufficient data</span>
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-white/[0.06] bg-black/30 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Scoring weights</p>
            <ul className="mt-3 flex-1 space-y-2.5">
              {DIMENSIONS.map((d, i) => (
                <li key={d.k}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-silver">{d.k}</span>
                    <span className="font-mono text-dim">{d.w}</span>
                  </div>
                  <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                    <motion.div
                      className="h-full rounded-full bg-silver/80"
                      initial={{ width: 0 }}
                      animate={{ width: inView ? `${(d.w / 30) * 100}%` : 0 }}
                      transition={{ duration: 1.2, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <motion.div
              className="mt-3 rounded-lg border px-3 py-2 font-mono text-[10px] leading-relaxed"
              animate={{ borderColor: phase === 2 ? `${accent}88` : "rgba(255,255,255,0.08)", color: phase === 2 ? "#cfe6ff" : "#8a8e98" }}
            >
              30-day roadmap → week 1: set up, read CONTRIBUTING, pick a good-first-issue
            </motion.div>
          </div>
        </div>
      </Frame>
    </div>
  );
}
