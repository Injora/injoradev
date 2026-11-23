"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { contributionSnapshot } from "@/content/contributions";
import { identity, ossStats } from "@/content/profile";
import { JollyRoger } from "./Pirate";

// One million berries per contribution in the last year.
const BOUNTY = contributionSnapshot.total * 1_000_000;
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>")`;

/** A bounty poster pinned to the wall: unrolls on arrival, then sways. */
export function WantedPoster() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const c = animate(0, BOUNTY, { duration: 2.4, delay: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v / 1_000_000) * 1_000_000) });
    return () => c.stop();
  }, [inView]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[340px]" style={{ perspective: 900 }}>
      {/* the nail */}
      <span className="absolute left-1/2 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[#5a4630] shadow-[0_2px_3px_rgb(0_0_0/0.6)]" aria-hidden />
      <motion.figure
        className="relative origin-top"
        initial={{ clipPath: "inset(0 0 100% 0)", rotateX: -25 }}
        animate={inView ? { clipPath: "inset(0 0 0% 0)", rotateX: 0 } : undefined}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="origin-top"
          animate={reduce || !inView ? undefined : { rotate: [-2.2, 2.2, -2.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}
          whileHover={{ rotate: 0, scale: 1.02 }}
        >
          <div
            className="relative overflow-hidden px-6 pb-6 pt-7 text-center text-[#3b2a1a] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 40%, #f3e3bf 0%, #e8d0a0 60%, #c9a66b 100%)",
              clipPath: "polygon(0 1%, 4% 0, 30% 1.2%, 60% 0, 96% 0.8%, 100% 3%, 99% 40%, 100% 75%, 98.5% 100%, 70% 99%, 35% 100%, 2% 99.2%, 0.5% 70%, 1% 35%)",
            }}
          >
            {/* paper grain */}
            <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
            <p className="display relative text-[3.4rem] leading-none tracking-[0.06em]">WANTED</p>
            <div className="relative mx-auto mt-4 flex aspect-[4/3] w-full items-center justify-center border-[3px] border-[#3b2a1a] bg-[radial-gradient(circle_at_50%_45%,#0b4f66,#021420)]">
              <motion.div
                className="w-[62%]"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : undefined}
                transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.7 }}
              >
                <JollyRoger className="h-full w-full drop-shadow-[0_0_18px_rgb(111_240_216/0.35)]" />
              </motion.div>
            </div>
            <p className="display-tight relative mt-3 text-lg tracking-[0.3em]">MERGED OR OPEN</p>
            <p className="display relative mt-1 text-[2.6rem] leading-none tracking-[0.04em]">{identity.name.toUpperCase()}</p>
            <p className="display-tight relative mt-3 flex items-baseline justify-center gap-1.5 text-[1.7rem] tabular-nums" aria-label={`Bounty: ${BOUNTY.toLocaleString("en-US")} berries`}>
              <span className="text-xl">฿</span>
              {n.toLocaleString("en-US")}
              <span className="text-base">-</span>
            </p>
            <p className="relative mt-3 text-[11px] font-semibold leading-snug text-[#5a4630]">
              {contributionSnapshot.total} contributions and {ossStats.mergedExternal} merged pull requests into other crews’ repositories
            </p>
          </div>
        </motion.div>
      </motion.figure>
    </div>
  );
}
