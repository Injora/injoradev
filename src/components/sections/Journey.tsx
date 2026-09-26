"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { journey } from "@/content/profile";
import { MaskLines } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

const STAGES = ["Learning", "Building", "Open Source", "Systems", "AI / ML"];

export function Journey() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.6"] });
  const line = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });

  return (
    <section id="journey" data-scene="journey" aria-labelledby="journey-title" className="relative px-[var(--gutter)] py-32 md:py-44">
      <div className="mx-auto max-w-[1200px]">
        <SectionLabel index="05" title="The journey" jp="道" />
        <h2 id="journey-title" className="display-tight mt-8 text-[13vw] text-snow md:text-[6.4vw]">
          <MaskLines lines={["Every commit", "sharpens the blade."]} />
        </h2>
        <ul className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              {i > 0 && <span className="text-dim">→</span>}
              <span className={i === STAGES.length - 1 ? "text-volt" : undefined}>{s}</span>
            </li>
          ))}
        </ul>

        <ol ref={ref} className="relative mt-20">
          {/* the energy line travelling down the page */}
          <div className="absolute bottom-0 left-[7px] top-0 w-px bg-white/[0.07] md:left-1/2" aria-hidden />
          <motion.div
            aria-hidden
            className="absolute bottom-0 left-[7px] top-0 w-px origin-top bg-gradient-to-b from-ice via-volt to-volt/0 md:left-1/2"
            style={{ scaleY: line }}
          />

          {journey.map((m, i) => {
            const right = i % 2 === 1;
            const future = m.date === "Next";
            return (
              <motion.li
                key={m.title}
                className={`relative mb-14 pl-10 md:mb-20 md:w-1/2 md:pl-0 ${right ? "md:ml-auto md:pl-16" : "md:pr-16 md:text-right"}`}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
                viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-1.5 h-[15px] w-[15px] rotate-45 border md:top-1.5 ${
                    right ? "md:-left-[7.5px]" : "md:left-auto md:-right-[7.5px]"
                  } ${future ? "border-ember bg-void" : "border-volt bg-void"}`}
                >
                  <span className={`absolute inset-[4px] ${future ? "bg-ember" : "bg-volt"}`} />
                </span>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className={future ? "text-ember" : "text-volt"}>{m.date}</span>
                  <span className="mx-2 text-dim">·</span>
                  <span className="text-dim">{m.stage}</span>
                </p>
                <h3 className="display-tight mt-3 text-2xl text-snow md:text-3xl">{m.title}</h3>
                <p className={`mt-2 max-w-md text-[15px] leading-relaxed text-mist ${right ? "" : "md:ml-auto"}`}>{m.body}</p>
                {m.href && (
                  <a href={m.href} target="_blank" rel="noreferrer" className="energy-link mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-silver">
                    evidence <span className="out-arrow">↗</span>
                  </a>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
