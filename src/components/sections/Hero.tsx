"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { identity } from "@/content/profile";
import { scrollToId } from "@/lib/scroll";

const ease = [0.16, 1, 0.3, 1] as const;
const NAME = identity.name.toUpperCase().split("");

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // As you scroll, the title rushes past the camera.
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.35]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.6], ["blur(0px)", reduce ? "blur(0px)" : "blur(10px)"]);
  const lift = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-18%"]);

  // Pointer parallax, layered.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 60, damping: 20 });
  const spy = useSpring(py, { stiffness: 60, damping: 20 });
  const titleX = useTransform(spx, (v) => v * -10);
  const titleY = useTransform(spy, (v) => v * -6);
  const metaX = useTransform(spx, (v) => v * 6);
  const metaY = useTransform(spy, (v) => v * 4);

  useEffect(() => {
    if (reduce) return;
    const on = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [px, py, reduce]);

  const d = reduce ? 0 : 1; // delay multiplier

  return (
    <section ref={ref} id="top" data-scene="hero" aria-label="Introduction" className="relative h-[115svh] min-h-[640px]">
      {/* a faint light appears in the dark */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-px w-[60vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-ice to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1.4], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.8, times: [0, 0.45, 1], ease: "easeInOut", delay: 0.15 }}
        />
      )}

      <motion.div style={{ scale, opacity, filter: blur, y: lift }} className="sticky top-0 flex h-svh flex-col justify-between px-[var(--gutter)] pb-8 pt-28 md:pb-10 md:pt-32">
        {/* art-directed: the blade cuts diagonally behind the name */}
        <div aria-hidden data-blade-slot data-blade-pose="diagonal" className="pointer-events-none absolute bottom-[14%] right-[6%] top-[14%] w-[44%] md:right-[8%] md:w-[42%]" />
        {/* top meta */}
        <motion.div style={{ x: metaX, y: metaY }} className="flex items-start justify-between gap-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 * d, duration: 1.2 }} className="space-y-1.5">
            <p className="eyebrow">
              <span className="jp mr-2 text-[0.8rem] tracking-normal text-silver/70">死神</span>
              {identity.division}
            </p>
            <p className="eyebrow !text-dim">GitHub · @{identity.githubHandle}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.15 * d, duration: 1.2 }} className="hidden text-right md:block">
            <p className="eyebrow">Current mission</p>
            <p className="mt-1.5 font-mono text-xs text-snow">{identity.mission}</p>
          </motion.div>
        </motion.div>

        {/* title block */}
        <div className="relative">
          <motion.h1 data-blade="ignore" style={{ x: titleX, y: titleY }} className="display select-none text-[21vw] text-snow md:text-[17.6vw]" aria-label={identity.name}>
            <span className="flex overflow-hidden pb-[0.04em]" aria-hidden>
              {NAME.map((ch, i) => (
                <motion.span
                  key={i}
                  className="metal-text inline-block"
                  initial={{ y: "110%", opacity: 0, filter: "blur(12px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 1.5, ease, delay: (1.05 + i * 0.07) * d }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <div className="mt-5 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-12 md:items-end">
            <motion.p
              className="font-mono text-[11px] uppercase tracking-[0.32em] text-snow md:col-span-5 md:text-xs"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease, delay: 1.7 * d }}
            >
              {identity.role}
              <span className="mx-3 text-volt">/</span>
              <span className="text-silver">{identity.secondary}</span>
            </motion.p>
            <motion.p
              className="max-w-md text-lg leading-snug text-silver md:col-span-5 md:col-start-8 md:text-xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease, delay: 1.85 * d }}
            >
              {identity.tagline}
            </motion.p>
          </div>
        </div>

        {/* bottom row */}
        <motion.div
          className="flex items-end justify-between gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3 * d, duration: 1.2 }}
        >
          <p className="max-w-[16rem] font-mono text-[11px] leading-relaxed text-mist">
            Merged in <span className="text-snow">cBioPortal</span> &amp; <span className="text-snow">Sugar Labs</span>
            <br />
            Next frontier → <span className="text-snow">{identity.next}</span>
          </p>
          <button onClick={() => scrollToId("about")} className="group flex flex-col items-center gap-3" aria-label="Scroll to about">
            <span className="eyebrow group-hover:text-snow">Scroll</span>
            <span className="relative block h-12 w-px overflow-hidden bg-white/10">
              <span className="scroll-line absolute inset-0 bg-snow" />
            </span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
