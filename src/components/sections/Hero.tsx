"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { identity } from "@/content/profile";
import { scrollToId } from "@/lib/scroll";
import { StrawHat } from "../ui/Pirate";

const ease = [0.16, 1, 0.3, 1] as const;
const NAME = identity.name.toUpperCase().split("");

function Ship() {
  return (
    <svg viewBox="0 0 48 40" className="h-full w-full" aria-hidden>
      <path d="M23 4 L23 31" stroke="#021420" strokeWidth="1.6" />
      <path d="M23 1 L34 1.5 L33 8.5 L23 8 Z" fill="#021420" />
      <circle cx="28.3" cy="4.4" r="1.6" fill="#f5f0e4" />
      <path d="M26.4 6.6 L30.2 6.6" stroke="#f5f0e4" strokeWidth="0.8" />
      <path d="M24.5 9 Q37 16 35 28 L24.5 28 Z" fill="#021420" />
      <path d="M21.5 11 Q12 18 13 28 L21.5 28 Z" fill="#021420" opacity="0.9" />
      <path d="M6 30 L42 30 L37 37 L11 37 Z" fill="#021420" />
    </svg>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const below = useRef<HTMLDivElement>(null);
  const d = reduce ? 0 : 1;
  const letterO = useRef<HTMLSpanElement>(null);
  const [hatX, setHatX] = useState<number | null>(null);

  // Keep the straw hat centred over the "O" at every width.
  useEffect(() => {
    const place = () => letterO.current && setHatX(letterO.current.offsetLeft + letterO.current.offsetWidth / 2);
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, []);

  // Fade the copy as the reader dives (set directly so SSR and hydration agree).
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (below.current) below.current.style.opacity = String(Math.max(0, 1 - p / 0.55));
  });

  return (
    <section ref={ref} id="top" aria-label="Introduction" className="relative h-svh min-h-[600px] overflow-hidden">
      {/* animated water displacement for the reflection */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="water-ripple" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.08" numOctaves="2" seed="4">
            {!reduce && <animate attributeName="baseFrequency" dur="14s" values="0.006 0.08;0.009 0.12;0.006 0.08" repeatCount="indefinite" />}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="18" />
        </filter>
      </svg>

      {/* the horizon: the ocean shader reads this element's position */}
      <div data-horizon className="absolute inset-x-0 top-[56svh]">
        {/* a ship crossing far out on the horizon */}
        {!reduce && (
          <div className="absolute bottom-0 left-0 h-[clamp(30px,3.4vw,52px)] w-[clamp(36px,4.1vw,62px)] translate-y-[18%] opacity-90" style={{ animation: "sail 95s linear -30s infinite" }}>
            <div className="bob h-full w-full">
              <Ship />
            </div>
          </div>
        )}

        <motion.p
          className="absolute bottom-[calc(15.2vw+1rem)] left-[var(--gutter)] text-sm font-semibold text-spray md:bottom-[calc(12.3vw+1.5rem)] md:text-base"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease, delay: 1.9 * d }}
        >
          {identity.role} and {identity.secondary.toLowerCase()}
        </motion.p>

        <h1 className="absolute bottom-0 left-[var(--gutter)] select-none" aria-label={identity.name}>
          <span className="display flex translate-y-[0.07em] overflow-hidden text-[21vw] leading-[0.723] md:text-[17vw]" aria-hidden>
            {NAME.map((ch, i) => (
              <motion.span
                key={i}
                ref={ch === "O" ? letterO : undefined}
                className="sea-text inline-block"
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.6, ease, delay: (0.5 + i * 0.09) * d }}
              >
                {ch}
              </motion.span>
            ))}
          </span>

          {/* the straw hat lands on the "O" */}
          {hatX !== null && (
            <motion.div
              className="absolute bottom-[calc(100%-0.16em)] w-[0.92em] -translate-x-1/2 cursor-pointer text-[21vw] md:text-[17vw]"
              style={{ left: hatX }}
              initial={{ y: reduce ? 0 : "-80svh", rotate: reduce ? -14 : -70, opacity: reduce ? 1 : 0 }}
              animate={{ y: 0, rotate: -14, opacity: 1 }}
              transition={{ type: "spring", stiffness: 90, damping: 9, mass: 0.9, delay: 1.7 * d, opacity: { duration: 0.2, delay: 1.7 * d } }}
              whileHover={{ y: "-0.06em", rotate: -6 }}
              onClick={() => window.dispatchEvent(new Event("injora:treasure"))}
            >
              <div className={reduce ? undefined : "hat-sway"}>
                <StrawHat className="h-auto w-full drop-shadow-[0_10px_18px_rgb(0_0_0/0.5)]" />
              </div>
            </motion.div>
          )}
        </h1>

        {/* reflection */}
        <div
          className="absolute left-[var(--gutter)] top-0 select-none opacity-40 [mask-image:linear-gradient(180deg,rgb(0_0_0/0.9),transparent_75%)]"
          style={{ filter: "url(#water-ripple)" }}
          aria-hidden
        >
          <span className="display flex -translate-y-[0.07em] -scale-y-100 overflow-hidden text-[21vw] leading-[0.723] md:text-[17vw]">
            {NAME.map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block text-spray"
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.6, ease, delay: (0.5 + i * 0.09) * d }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        </div>

        {/* the splash ring where the name breaks the surface */}
        {!reduce && (
          <motion.span
            className="absolute left-[30%] top-0 h-[6vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-spray/60"
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: [0.1, 1.4], opacity: [0, 0.8, 0] }}
            transition={{ duration: 2.4, ease: "easeOut", delay: 0.6, times: [0, 0.2, 1] }}
            aria-hidden
          />
        )}
      </div>

      <div ref={below} className="absolute inset-x-0 bottom-0 px-[var(--gutter)] pb-8 md:pb-10">
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
          <motion.p
            className="max-w-md text-lg leading-snug text-snow md:col-span-5 md:text-xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease, delay: 2.1 * d }}
          >
            {identity.tagline}
          </motion.p>

          <motion.button
            onClick={() => scrollToId("about")}
            className="group hidden flex-col items-center gap-3 justify-self-center md:col-span-2 md:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 2.5 * d }}
          >
            <span className="text-xs font-semibold text-mist transition-colors group-hover:text-snow">Dive in</span>
            <span className="relative block h-12 w-px overflow-hidden bg-white/10">
              <span className="scroll-line absolute inset-0 bg-glow" />
            </span>
          </motion.button>

          <motion.p
            className="text-sm leading-relaxed text-mist md:col-span-5 md:text-right"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease, delay: 2.3 * d }}
          >
            Merged in <span className="text-snow">cBioPortal</span> and <span className="text-snow">Sugar Labs</span>
            <br />
            {identity.mission}, heading for <span className="text-gold">{identity.next}</span>
          </motion.p>
        </div>
      </div>
    </section>
  );
}
