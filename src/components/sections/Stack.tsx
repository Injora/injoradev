"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { techGroups, techs, type Tech, type TechGroupId } from "@/content/profile";
import { MaskLines, Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

const CLUSTERS: Record<TechGroupId, { x: number; y: number }> = {
  shikai: { x: 15, y: 31 },
  bankai: { x: 48, y: 27 },
  kido: { x: 80, y: 30 },
  tools: { x: 40, y: 73 },
  training: { x: 72, y: 73 },
};

// Hand-placed (percent of the stage) so labels never collide; the detail
// panel owns the bottom-left corner.
const POS: Record<string, [number, number]> = {
  JavaScript: [5, 16],
  TypeScript: [19, 12],
  React: [26, 25],
  "Next.js": [24, 43],
  "React Native": [3, 46],
  "HTML / CSS": [3, 31],
  Tailwind: [13, 56],
  "Node.js": [40, 11],
  Express: [55, 12],
  Supabase: [60, 29],
  "Socket.io": [55, 44],
  Prisma: [40, 42],
  "Python / Django": [34, 20],
  PostgreSQL: [72, 15],
  PostGIS: [88, 17],
  MySQL: [89, 41],
  MongoDB: [73, 45],
  "Git / GitHub": [30, 61],
  "GitHub API": [46, 60],
  Vercel: [33, 87],
  n8n: [50, 86],
  Java: [63, 61],
  "Spring Boot": [79, 61],
  "LLM APIs": [70, 88],
};

type Placed = Tech & { x: number; y: number; z: number };

function layout(): Placed[] {
  return techs.map((t, i) => {
    const [x, y] = POS[t.name] ?? [CLUSTERS[t.group].x, CLUSTERS[t.group].y];
    const z = Math.round(((i * 37) % 7) * 18 - 54 + t.weight * 50);
    return { ...t, x, y, z };
  });
}

export function Stack() {
  const placed = useMemo(() => layout(), []);
  const [active, setActive] = useState<Tech | null>(null);
  const [group, setGroup] = useState<TechGroupId | null>(null);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, (v) => v * -7), { stiffness: 50, damping: 18 });
  const ry = useSpring(useTransform(mx, (v) => v * 9), { stiffness: 50, damping: 18 });

  const focusGroup = active?.group ?? group;
  const groupInfo = techGroups.find((g) => g.id === focusGroup);

  return (
    <section id="stack" data-scene="stack" aria-labelledby="stack-title" className="relative px-[var(--gutter)] py-32 md:py-44">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <SectionLabel index="02" title="Zanpakutō arsenal" jp="斬魄刀" />
            <h2 id="stack-title" className="display-tight mt-8 text-[13vw] text-snow md:text-[6.4vw]">
              <MaskLines lines={["The stack,", "released."]} />
            </h2>
          </div>
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-lg leading-relaxed text-mist">
              Everything here is used in a real repository or pull request. Hover a node to see where.
            </p>
          </Reveal>
        </div>

        {/* Desktop: constellation */}
        <div
          ref={ref}
          data-blade-shatter
          className="relative mt-16 hidden h-[78vh] min-h-[560px] md:block"
          style={{ perspective: 1400 }}
          onPointerMove={(e) => {
            if (reduce || !ref.current) return;
            const r = ref.current.getBoundingClientRect();
            mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
            my.set(((e.clientY - r.top) / r.height) * 2 - 1);
          }}
          onPointerLeave={() => {
            mx.set(0);
            my.set(0);
            setGroup(null);
          }}
        >
          <motion.div className="absolute inset-0" style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>
            {/* connective lines */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {placed.map((t) => {
                const c = CLUSTERS[t.group];
                const lit = focusGroup === t.group;
                return (
                  <motion.line
                    key={t.name}
                    x1={c.x}
                    y1={c.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={lit ? "#4da3ff" : "#ffffff"}
                    strokeOpacity={lit ? (active?.name === t.name ? 0.9 : 0.4) : 0.08}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  />
                );
              })}
            </svg>

            {/* cluster cores */}
            {techGroups.map((g) => {
              const c = CLUSTERS[g.id];
              const lit = focusGroup === g.id;
              return (
                <button
                  key={g.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  onPointerEnter={() => setGroup(g.id)}
                  onFocus={() => setGroup(g.id)}
                  aria-label={`${g.label} (${g.codename}): ${g.blurb}`}
                >
                  <span className={`mx-auto mb-2 block h-2 w-2 rotate-45 border transition-colors duration-500 ${lit ? "border-volt bg-volt" : "border-white/40"}`} />
                  <span className={`block font-mono text-[10px] uppercase tracking-[0.26em] transition-colors duration-500 ${lit ? "text-volt" : "text-dim"}`}>{g.codename}</span>
                  <span className={`block text-xs transition-colors duration-500 ${lit ? "text-snow" : "text-mist"}`}>{g.label}</span>
                </button>
              );
            })}

            {/* tech nodes */}
            {placed.map((t, i) => {
              const isActive = active?.name === t.name;
              const dim = focusGroup !== null && focusGroup !== t.group;
              const size = 5 + t.weight * 7;
              return (
                <motion.button
                  key={t.name}
                  className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 whitespace-nowrap"
                  style={{ left: `${t.x}%`, top: `${t.y}%`, transformStyle: "preserve-3d" }}
                  initial={{ opacity: 0, z: -300 }}
                  whileInView={{ opacity: 1, z: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.3 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  onPointerEnter={() => setActive(t)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(t)}
                  onBlur={() => setActive(null)}
                  aria-describedby="stack-detail"
                >
                  <motion.span
                    className="flex items-center gap-2.5"
                    animate={{ z: isActive ? t.z + 140 : t.z, scale: isActive ? 1.18 : 1, opacity: dim ? 0.28 : 1 }}
                    transition={{ type: "spring", stiffness: 160, damping: 20 }}
                    style={{ animation: reduce ? undefined : `float-${i % 3} ${7 + (i % 5)}s ease-in-out ${i * -0.7}s infinite` }}
                  >
                    <span
                      className="relative block rounded-full transition-[background-color,box-shadow] duration-500"
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: isActive ? "#cfe6ff" : "#c9ccd3",
                        boxShadow: isActive ? "0 0 0 6px rgb(77 163 255 / 0.18), 0 0 30px 6px rgb(77 163 255 / 0.55)" : "0 0 14px rgb(201 204 211 / 0.25)",
                      }}
                    >
                      {t.signature && <span className="absolute -inset-[5px] rounded-full border border-ember/70" />}
                    </span>
                    <span className={`text-[15px] transition-colors duration-300 ${isActive ? "text-snow" : "text-silver"}`}>{t.name}</span>
                  </motion.span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* detail panel */}
          <div id="stack-detail" aria-live="polite" className="glass pointer-events-none absolute bottom-0 left-0 w-[380px] rounded-2xl p-6">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div key={active.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                  <p className="eyebrow !text-volt">
                    {techGroups.find((g) => g.id === active.group)?.codename} · {techGroups.find((g) => g.id === active.group)?.label}
                  </p>
                  <p className="display-tight mt-3 text-3xl text-snow">{active.name}</p>
                  {active.signature && <p className="mt-1 font-mono text-[11px] text-ember">zanpakutō — main language</p>}
                  <p className="mt-3 text-[15px] leading-relaxed text-silver">{active.note}</p>
                  <p className="eyebrow mt-5">Used in</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {active.usedIn.map((u) => (
                      <li key={u} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-mist">
                        {u}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : groupInfo ? (
                <motion.div key={groupInfo.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                  <p className="eyebrow !text-volt">{groupInfo.codename}</p>
                  <p className="display-tight mt-3 text-3xl text-snow">{groupInfo.label}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-silver">{groupInfo.blurb}</p>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="eyebrow">Arsenal</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-silver">
                    <span className="text-snow">{techs.length} technologies</span> across five forms. Move through the constellation — each node lights up with how it’s used.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: grouped, tappable */}
        <MobileStack />
      </div>
    </section>
  );
}

function MobileStack() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div data-blade-shatter className="mt-14 space-y-10 md:hidden">
      {techGroups.map((g) => {
        const members = techs.filter((t) => t.group === g.id);
        const current = members.find((m) => m.name === open);
        return (
          <Reveal key={g.id}>
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <p className="display-tight text-2xl text-snow">{g.label}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-volt">{g.codename}</p>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {members.map((t) => (
                <li key={t.name}>
                  <button
                    onClick={() => setOpen(open === t.name ? null : t.name)}
                    aria-expanded={open === t.name}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      open === t.name ? "border-volt/60 bg-volt/10 text-snow" : "border-line text-silver"
                    }`}
                  >
                    {t.signature && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ember align-middle" />}
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
            <AnimatePresence initial={false}>
              {current && (
                <motion.div
                  key={current.name}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-xl border border-line bg-white/[0.03] p-4">
                    <p className="text-[15px] leading-relaxed text-silver">{current.note}</p>
                    <p className="mt-3 font-mono text-[11px] text-mist">Used in: {current.usedIn.join(" · ")}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        );
      })}
    </div>
  );
}
