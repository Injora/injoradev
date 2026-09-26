"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Frame } from "./Frame";

const N = 21;

function qrPattern(seed: number) {
  let s = seed * 9973 + 17;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cells: boolean[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      if (finder) {
        const fx = x > 13 ? x - 14 : x;
        const fy = y > 13 ? y - 14 : y;
        const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3));
        cells.push(ring !== 2);
      } else cells.push(rnd() > 0.52);
    }
  return cells;
}

const CHECKS = ["TOTP window (HMAC)", "PostGIS geofence", "Mock-location check"];

export function EventsVisual({ accent }: { accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });
  const [tick, setTick] = useState(0);
  const period = 15;
  const seed = Math.floor(tick / period);
  const cells = useMemo(() => qrPattern(seed + 1), [seed]);
  const remain = period - (tick % period);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [inView]);

  const checked = Math.min(CHECKS.length, tick % period);

  return (
    <div ref={ref} className="h-full">
      <Frame title="nst-events / attendance" accent={accent}>
        <div className="grid h-full grid-cols-[1fr_1.05fr] gap-5 p-5">
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-black/30 p-4">
            <div className="relative">
              <svg viewBox="0 0 120 120" className="absolute -inset-7 h-[calc(100%+56px)] w-[calc(100%+56px)] -rotate-90" aria-hidden>
                <circle cx="60" cy="60" r="57" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="57"
                  fill="none"
                  stroke={accent}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ pathLength: remain / period }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              <AnimatePresence mode="wait">
                <motion.div
                  key={seed}
                  className="grid aspect-square w-[150px] gap-[1.5px] rounded-md bg-snow p-2 lg:w-[170px]"
                  style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.45 }}
                >
                  {cells.map((on, i) => (
                    <span key={i} className={on ? "bg-black" : ""} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-6 font-mono text-[11px] text-silver">
              rotates in <span className="text-snow">{String(remain).padStart(2, "0")}s</span>
            </p>
          </div>

          <div className="flex flex-col">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Scan validation</p>
            <ul className="mt-3 space-y-2">
              {CHECKS.map((c, i) => {
                const ok = i < checked;
                return (
                  <li key={c} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[12.5px]">
                    <span className="text-silver">{c}</span>
                    <motion.span
                      className="font-mono text-[11px]"
                      animate={{ color: ok ? accent : "#5d616b" }}
                    >
                      {ok ? "pass" : "···"}
                    </motion.span>
                  </li>
                );
              })}
            </ul>
            <motion.div
              className="mt-3 rounded-lg px-3 py-2.5 text-center font-mono text-[11px]"
              animate={{
                backgroundColor: checked === CHECKS.length ? `${accent}22` : "rgba(255,255,255,0.02)",
                color: checked === CHECKS.length ? "#f2f3f6" : "#5d616b",
              }}
            >
              {checked === CHECKS.length ? "attendance marked" : "waiting for scan"}
            </motion.div>

            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Two-tier RBAC</p>
            <div className="mt-2 space-y-1.5 font-mono text-[10.5px]">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-dim">global</span>
                {["STUDENT", "FACULTY_ADMIN", "PLATFORM_ADMIN"].map((r) => (
                  <span key={r} className="rounded border border-white/10 px-1.5 text-silver">{r}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-dim">club</span>
                {["CLUB_ADMIN", "CORE_MEMBER", "MEMBER"].map((r) => (
                  <span key={r} className="rounded border border-white/10 px-1.5 text-silver">{r}</span>
                ))}
              </div>
              <p className="pt-1 text-dim">Express RBAC ∧ Postgres RLS</p>
            </div>
          </div>
        </div>
      </Frame>
    </div>
  );
}
