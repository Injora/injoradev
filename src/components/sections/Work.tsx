"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { communityProjects, flagshipProjects, moreProjects, type Project, type ProjectVisual, type SmallProject } from "@/content/profile";
import { ArenaVisual } from "../mockups/ArenaVisual";
import { CompassVisual } from "../mockups/CompassVisual";
import { EventsVisual } from "../mockups/EventsVisual";
import { ShuttleVisual } from "../mockups/ShuttleVisual";
import { Magnetic } from "../ui/Magnetic";
import { MaskLines, Reveal } from "../ui/Reveal";
import { WaveMark } from "../ui/WaveMark";

const VISUALS: Record<ProjectVisual, (p: { accent: string }) => ReactNode> = {
  compass: CompassVisual,
  events: EventsVisual,
  shuttle: ShuttleVisual,
  arena: ArenaVisual,
};

const N = flagshipProjects.length;

/**
 * Distance of the scroll position from project i's slot, with a plateau so
 * each project holds still (fully readable) for most of its slot.
 *  → 0 while active, ±1 when fully out.
 */
function useSlot(progress: MotionValue<number>, i: number) {
  return useTransform(progress, (p) => {
    let d = (p - (i + 0.5) / N) * N; // −0.5..0.5 within own slot
    if (i === 0 && d < 0) d = 0;
    if (i === N - 1 && d > 0) d = 0;
    const s = Math.sign(d);
    const t = Math.min(1, Math.max(0, (Math.abs(d) - 0.2) / 0.5));
    return s * t;
  });
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <WaveMark />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <h2 id="work-title" className="display-tight text-[13vw] text-snow md:col-span-8 md:text-[6.4vw]">
            <MaskLines lines={["Ships I’ve", "built and sailed."]} />
          </h2>
          <Reveal className="md:col-span-4">
            <p className="text-lg leading-relaxed text-mist">
              Personal projects at full release — systems with real constraints: auth, geofences, row-level security, and evidence you can check.
            </p>
          </Reveal>
        </div>
      </div>

      <FlagshipSequence />
      <MobileFlagships />

      <div className="mx-auto mt-32 max-w-[1500px] px-[var(--gutter)] md:mt-40">
        <ProjectList title="More personal builds" items={moreProjects} />
        <div className="h-24" />
        <ProjectList title="Community and hackathon builds" items={communityProjects} />
      </div>
    </section>
  );
}

function FlagshipSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(Math.min(N - 1, Math.floor(p * N))));

  return (
    <div ref={ref} className="relative mt-20 hidden md:block" style={{ height: `${N * 120}vh` }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        {flagshipProjects.map((p, i) => (
          <Environment key={p.slug} progress={scrollYProgress} i={i} accent={p.accent} />
        ))}

        <div className="relative mx-auto grid h-full max-w-[1500px] grid-cols-12 items-center gap-8 px-[var(--gutter)] pt-16">
          <div className="relative col-span-5 h-[62vh]">
            {flagshipProjects.map((p, i) => (
              <ProjectText key={p.slug} project={p} index={i} progress={scrollYProgress} active={active === i} />
            ))}
          </div>
          <div className="relative col-span-7 h-[62vh]" style={{ perspective: 1600 }}>
            {flagshipProjects.map((p, i) => (
              <ProjectStage key={p.slug} project={p} index={i} progress={scrollYProgress} active={active === i} />
            ))}
          </div>
        </div>

        {/* progress rail */}
        <nav aria-label="Projects" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-6">
          {flagshipProjects.map((p, i) => (
            <div key={p.slug} className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold transition-colors duration-500 ${active === i ? "text-snow" : "text-dim"}`}>{p.name}</span>
              <span className="relative h-px w-10 overflow-hidden bg-white/10">
                <span
                  className="absolute inset-0 origin-left transition-transform duration-700 ease-[var(--ease-cinema)]"
                  style={{ background: p.accent, transform: `scaleX(${active >= i ? 1 : 0})` }}
                />
              </span>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Environment({ progress, i, accent }: { progress: MotionValue<number>; i: number; accent: string }) {
  const slot = useSlot(progress, i);
  const opacity = useTransform(slot, (d) => 1 - Math.abs(d));
  const scale = useTransform(slot, (d) => 1 + d * 0.25);
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity }}>
      <motion.div
        className="absolute right-[-10%] top-1/2 h-[120vh] w-[80vw] -translate-y-1/2 rounded-full blur-[120px]"
        style={{ scale, background: `radial-gradient(closest-side, ${accent}2e, transparent)` }}
      />
      {/* a sonar sweep behind each project */}
      <svg className="absolute right-[18%] top-1/2 h-[90vh] w-[90vh] -translate-y-1/2 translate-x-1/2" viewBox="0 0 100 100">
        {[0, 1.2, 2.4].map((delay) => (
          <circle key={delay} cx="50" cy="50" r="48" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="0.25" className="sonar" style={{ animationDelay: `${delay}s` }} />
        ))}
      </svg>
    </motion.div>
  );
}

function ProjectText({ project: p, index, progress, active }: { project: Project; index: number; progress: MotionValue<number>; active: boolean }) {
  const slot = useSlot(progress, index);
  const reduce = useReducedMotion();
  const y = useTransform(slot, (d) => (reduce ? 0 : d * -90));
  const opacity = useTransform(slot, (d) => 1 - Math.min(1, Math.abs(d) * 1.6));
  const filter = useTransform(slot, (d) => `blur(${reduce ? 0 : Math.abs(d) * 8}px)`);

  return (
    <motion.article
      className="absolute inset-0 flex flex-col justify-center"
      style={{ y, opacity, filter, pointerEvents: active ? "auto" : "none" }}
      aria-hidden={!active}
      aria-labelledby={`p-${p.slug}`}
    >
      <p className="text-sm font-semibold" style={{ color: p.accent }}>
        {p.codename}, {p.year}
      </p>
      <h3 id={`p-${p.slug}`} className="display-tight mt-4 text-[4.4vw] leading-[0.95] text-snow">
        {p.name}
      </h3>
      <p className="mt-4 text-xl text-silver">{p.oneLiner}</p>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-mist">{p.summary}</p>
      <ul className="mt-6 max-w-lg space-y-2.5">
        {p.highlights.map((h) => (
          <li key={h} className="flex gap-3 text-[14px] leading-relaxed text-silver">
            <span className="mt-[9px] h-px w-3 shrink-0" style={{ background: p.accent }} />
            {h}
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-wrap items-center gap-2">
        {p.stack.map((s) => (
          <span key={s} className="rounded-full border border-line bg-abyss/30 px-3 py-1 text-xs text-silver">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-3">
        <ProjectLinks project={p} tabbable={active} />
      </div>
    </motion.article>
  );
}

function ProjectLinks({ project: p, tabbable = true }: { project: Project; tabbable?: boolean }) {
  return (
    <>
      {p.live && (
        <Magnetic>
          <a
            href={p.live}
            target="_blank"
            rel="noreferrer"
            tabIndex={tabbable ? 0 : -1}
            className="inline-flex items-center gap-2 rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-abyss transition-colors hover:bg-glow"
          >
            Visit live site <span className="out-arrow">↗</span>
          </a>
        </Magnetic>
      )}
      <Magnetic>
        <a
          href={p.code}
          target="_blank"
          rel="noreferrer"
          tabIndex={tabbable ? 0 : -1}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-snow transition-colors hover:border-glow/60"
        >
          View code <span className="out-arrow">↗</span>
        </a>
      </Magnetic>
    </>
  );
}

function ProjectStage({ project: p, index, progress, active }: { project: Project; index: number; progress: MotionValue<number>; active: boolean }) {
  const slot = useSlot(progress, index);
  const reduce = useReducedMotion();
  // Rises from the deep, tilted; leaves past the camera.
  const z = useTransform(slot, (d) => (reduce ? 0 : d < 0 ? d * 700 : d * 380));
  const rotateX = useTransform(slot, (d) => (reduce ? 0 : d < 0 ? d * -14 : d * 6));
  const rotateY = useTransform(slot, (d) => (reduce ? 0 : d * -16));
  const opacity = useTransform(slot, (d) => 1 - Math.min(1, Math.abs(d) * 1.4));
  const filter = useTransform(slot, (d) => `blur(${reduce ? 0 : Math.abs(d) * 14}px)`);
  const Visual = VISUALS[p.visual];

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <motion.div
      className="absolute inset-0"
      style={{ z, rotateX, rotateY, opacity, filter, transformStyle: "preserve-3d", pointerEvents: active ? "auto" : "none" }}
      aria-hidden
    >
      <a
        href={p.live ?? p.code}
        target="_blank"
        rel="noreferrer"
        tabIndex={-1}
        data-cursor="view"
        data-cursor-label="Open"
        className="block h-full transition-transform duration-700 ease-[var(--ease-cinema)]"
        style={{ transform: `rotateX(${tilt.y * -4}deg) rotateY(${tilt.x * 5}deg) translateZ(0)` }}
        onPointerMove={(e) => {
          if (reduce) return;
          const r = e.currentTarget.getBoundingClientRect();
          setTilt({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 });
        }}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <Visual accent={p.accent} />
      </a>
    </motion.div>
  );
}

function MobileFlagships() {
  return (
    <div className="mt-16 space-y-24 px-[var(--gutter)] md:hidden">
      {flagshipProjects.map((p) => {
        const Visual = VISUALS[p.visual];
        return (
          <article key={p.slug} aria-labelledby={`pm-${p.slug}`}>
            <Reveal>
              {/* mockups are designed for landscape; scale them down to fit a phone */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
                <div className="absolute left-0 top-0 h-[166.6%] w-[166.6%] origin-top-left scale-[0.6]">
                  <Visual accent={p.accent} />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-8 text-sm font-semibold" style={{ color: p.accent }}>
                {p.codename}, {p.year}
              </p>
              <h3 id={`pm-${p.slug}`} className="display-tight mt-3 text-[11vw] text-snow">
                {p.name}
              </h3>
              <p className="mt-3 text-lg text-silver">{p.oneLiner}</p>
              <ul className="mt-5 space-y-2.5">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-[14px] leading-relaxed text-silver">
                    <span className="mt-[9px] h-px w-3 shrink-0" style={{ background: p.accent }} />
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                {p.stack.map((s) => (
                  <span key={s} className="rounded-full border border-line bg-abyss/30 px-3 py-1 text-xs text-silver">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <ProjectLinks project={p} />
              </div>
            </Reveal>
          </article>
        );
      })}
    </div>
  );
}

function ProjectList({ title, items }: { title: string; items: SmallProject[] }) {
  return (
    <div>
      <Reveal>
        <div className="border-b border-line pb-4">
          <h3 className="display-tight text-3xl text-snow md:text-4xl">{title}</h3>
        </div>
      </Reveal>
      <ul>
        {items.map((p, i) => (
          <Reveal as="li" key={p.name} delay={i * 0.05}>
            <a
              href={p.live ?? p.code}
              target="_blank"
              rel="noreferrer"
              className="group relative grid grid-cols-12 items-baseline gap-4 border-b border-line py-6 md:py-7"
            >
              <span className="absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-gradient-to-r from-glow to-transparent transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:scale-x-100" />
              <span className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-t from-glow/[0.07] to-transparent transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:scale-y-100" />
              <span className="col-span-12 flex items-baseline gap-4 md:col-span-4">
                <span className="display-tight text-2xl text-snow transition-transform duration-500 ease-[var(--ease-cinema)] group-hover:translate-x-2 md:text-3xl">
                  {p.name}
                </span>
              </span>
              <span className="col-span-12 text-[15px] leading-relaxed text-mist md:col-span-5">{p.description}</span>
              <span className="col-span-12 flex flex-wrap items-center gap-2 md:col-span-3 md:justify-end">
                {p.note && <span className="rounded-full border border-glow/30 px-2.5 py-0.5 text-xs text-spray">{p.note}</span>}
                <span className="text-xs text-mist">{p.stack.join(", ")}</span>
                <span className="out-arrow text-snow">↗</span>
              </span>
            </a>
            {p.live && (
              <a href={p.code} target="_blank" rel="noreferrer" className="sr-only focus:not-sr-only">
                {p.name} source code
              </a>
            )}
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
