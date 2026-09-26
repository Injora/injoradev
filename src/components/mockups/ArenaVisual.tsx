"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";

// Abstract fighters — race labels only, no character art.
const P1 = ["Soul Reaper", "Soul Reaper", "Quincy"];
const P2 = ["Espada", "Arrancar", "Quincy"];

type Beat = { a: number; b: number; hit: "a" | "b" | null; text: string; revive?: boolean };
const SCRIPT: Beat[] = [
  { a: 72, b: 64, hit: null, text: "Clash — spiritual pressure" },
  { a: 72, b: 32, hit: "b", text: "×2 vs Arrancar" },
  { a: 40, b: 0, hit: "b", text: "Survivor carries 40 BP" },
  { a: 0, b: 18, hit: "a", text: "Defeated…" },
  { a: 40, b: 18, hit: null, text: "BANKAI · +40 BP", revive: true },
  { a: 22, b: 0, hit: "b", text: "Winner advances" },
];

export function ArenaVisual({ accent }: { accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setI((x) => (x + 1) % SCRIPT.length), 1500);
    return () => clearInterval(id);
  }, [inView]);

  const beat = SCRIPT[i];

  return (
    <div ref={ref} className="h-full">
      <Frame title="bleach-battle-arena / battle" accent={accent}>
        <motion.div
          className="grid h-full grid-cols-[1fr_1.2fr_1fr] items-center gap-4 p-5"
          animate={beat.hit ? { x: [0, -5, 5, -3, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Team names={P1} label="Player 1" active={0} accent={accent} />

          <div className="relative flex h-full flex-col items-center justify-center">
            <Bar value={beat.a} accent={accent} label="P1 BP" hit={beat.hit === "a"} />
            <div className="my-5 flex items-center gap-3">
              <span className="h-px w-10 bg-white/15" />
              <span className="display text-xl text-snow">VS</span>
              <span className="h-px w-10 bg-white/15" />
            </div>
            <Bar value={beat.b} accent="#c9ccd3" label="P2 BP" hit={beat.hit === "b"} />
            <AnimatePresence mode="wait">
              <motion.p
                key={i}
                className={`mt-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] ${beat.revive ? "text-ember" : "text-silver"}`}
                initial={{ opacity: 0, y: 8, scale: beat.revive ? 1.4 : 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {beat.text}
              </motion.p>
            </AnimatePresence>
            {beat.revive && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-full bg-ember/20 blur-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.4 }}
              />
            )}
          </div>

          <Team names={P2} label="Player 2" active={0} accent="#c9ccd3" />
        </motion.div>
      </Frame>
    </div>
  );
}

function Team({ names, label, accent }: { names: string[]; label: string; active: number; accent: string }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{label}</p>
      {names.map((n, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden>
            <rect x="1" y="1" width="22" height="22" rx="5" fill="none" stroke={accent} strokeOpacity="0.5" />
            <path d={i === 0 ? "M6 18 18 6" : i === 1 ? "M12 5v14M5 12h14" : "M12 5 19 18H5Z"} stroke={accent} strokeWidth="1.4" fill="none" />
          </svg>
          <span className="truncate text-[12px] text-silver">{n}</span>
        </div>
      ))}
    </div>
  );
}

function Bar({ value, accent, label, hit }: { value: number; accent: string; label: string; hit: boolean }) {
  return (
    <div className="w-full">
      <div className="flex justify-between font-mono text-[10px] text-dim">
        <span>{label}</span>
        <span className="text-snow">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: accent }}
          animate={{ width: `${value}%`, opacity: hit ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
