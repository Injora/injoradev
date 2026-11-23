"use client";

import { AnimatePresence, animate, motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { contributionSnapshot } from "@/content/contributions";
import { ossOrgs, ossStats, type OssOrg } from "@/content/profile";
import { JollyRoger } from "../ui/Pirate";
import { MaskLines, Reveal } from "../ui/Reveal";
import { WaveMark } from "../ui/WaveMark";

/* Node layout in a 600×420 space. */
const CENTER = { x: 300, y: 210 };
const ORG_POS: Record<string, { x: number; y: number }> = {
  cbioportal: { x: 470, y: 110 },
  sugarlabs: { x: 130, y: 105 },
  docusaurus: { x: 505, y: 315 },
  "nst-sdc": { x: 110, y: 305 },
  "first-contributions": { x: 300, y: 372 },
};

export function OpenSource() {
  const [selected, setSelected] = useState<string>("cbioportal");
  const org = ossOrgs.find((o) => o.id === selected)!;

  return (
    <section id="open-source" aria-labelledby="oss-title" className="relative px-[var(--gutter)] py-32 md:py-44">
      <div className="mx-auto max-w-[1500px]">
        <WaveMark />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <h2 id="oss-title" className="display-tight text-[12vw] text-snow md:col-span-8 md:text-[6vw]">
            <MaskLines lines={["Every crew", "needs allies."]} />
          </h2>
          <Reveal className="md:col-span-4">
            <p className="text-lg leading-relaxed text-mist">
              Code doesn’t get better in isolation. These are fixes and features shipped into projects other crews maintain — reviewed, discussed and merged.
            </p>
          </Reveal>
        </div>

        {/* verified stats */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          <Stat value={ossStats.mergedExternal} label={`PRs merged into repos I don’t own, as of ${ossStats.asOf}`} />
          <Stat value={contributionSnapshot.total} label="contributions in the last year" />
          <Stat value={contributionSnapshot.pullRequests} label="pull requests opened in the last year" />
          <Stat value={contributionSnapshot.commits} label="commits in the last year" />
        </div>

        <FeaturedPR />

        {/* network + detail */}
        <div className="mt-24 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Network selected={selected} onSelect={setSelected} />
          </Reveal>
          <div className="lg:col-span-5">
            <OrgDetail org={org} />
          </div>
        </div>

        <Heatmap />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, value]);
  return (
    <div className="bg-abyss/70 p-6 backdrop-blur md:p-8">
      <p ref={ref} className="display text-5xl text-snow md:text-6xl" aria-label={String(value)}>
        {n}
      </p>
      <p className="mt-3 max-w-[14rem] text-sm leading-snug text-mist">{label}</p>
    </div>
  );
}

const DIFF: { t: " " | "+" | "-"; s: string }[] = [
  { t: " ", s: "        : base.getGenomicDataFilters().stream()" },
  { t: " ", s: "            .filter(f -> f.getValues() != null && !f.getValues().isEmpty())" },
  { t: " ", s: "            .collect(Collectors.toList());" },
  { t: "+", s: "// Filter out genericAssayDataFilters with null or empty values to prevent SQL errors." },
  { t: "+", s: "List<GenericAssayDataFilter> validGenericAssayDataFilters =" },
  { t: "+", s: "    base.getGenericAssayDataFilters() == null" },
  { t: "+", s: "        ? null" },
  { t: "+", s: "        : base.getGenericAssayDataFilters().stream()" },
  { t: "+", s: "            .filter(f -> f.getValues() != null && !f.getValues().isEmpty())" },
  { t: "+", s: "            .collect(Collectors.toList());" },
  { t: " ", s: "return new StudyViewFilterContext(" },
  { t: "-", s: "    base.getGenericAssayDataFilters()," },
  { t: "+", s: "    validGenericAssayDataFilters," },
];

function FeaturedPR() {
  const pr = ossOrgs[0].contributions[0];
  return (
    <div className="mt-24 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
      <Reveal className="lg:col-span-5">
        <p className="text-sm font-semibold text-glow">Merged in September 2026</p>
        <h3 className="display-tight mt-4 text-4xl text-snow md:text-5xl">Java, in production.</h3>
        <p className="mt-5 text-lg leading-relaxed text-silver">
          The training arc, applied: a backend fix in cBioPortal’s Spring codebase. Null filter values were reaching a ClickHouse SQL mapper and
          surfacing as 500s — now they’re dropped before categorization, with a JUnit test to keep it that way.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 rounded-full bg-glow/15 px-3 py-1 text-spray"><span className="h-1.5 w-1.5 rounded-full bg-glow" />Merged</span>
          <span className="text-mist">{pr.repo}#{pr.number}</span>
          <span className="text-dim">{pr.diff}</span>
        </div>
        <a href={pr.url} target="_blank" rel="noreferrer" className="wave-link mt-6 inline-flex items-center gap-2 text-sm font-semibold text-snow">
          Read the pull request <span className="out-arrow">↗</span>
        </a>
      </Reveal>
      <Reveal className="lg:col-span-7" delay={0.1}>
        <figure className="glass overflow-hidden rounded-2xl">
          <figcaption className="flex items-center justify-between border-b border-line px-5 py-3 font-mono text-[11px]">
            <span className="text-silver">StudyViewFilterFactory.java</span>
          </figcaption>
          <pre className="overflow-x-auto py-4 font-mono text-[11.5px] leading-[1.85] md:text-[12.5px]" data-lenis-prevent-horizontal>
            <code>
              {DIFF.map((l, i) => (
                <motion.span
                  key={i}
                  className={`block px-5 ${l.t === "+" ? "bg-glow/[0.07] text-spray" : l.t === "-" ? "bg-[#ff8a7a]/[0.08] text-[#ff9d8f]" : "text-dim"}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <span className="mr-4 select-none opacity-60">{l.t}</span>
                  {l.s}
                </motion.span>
              ))}
            </code>
          </pre>
        </figure>
      </Reveal>
    </div>
  );
}

function Network({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const sats = useMemo(
    () =>
      ossOrgs.flatMap((o) => {
        const p = ORG_POS[o.id];
        const n = o.contributions.length;
        return o.contributions.map((c, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2 + o.id.length;
          const r = 34 + (n > 5 ? (i % 2) * 12 : 0);
          return { org: o.id, key: c.url, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, state: c.state };
        });
      }),
    []
  );

  return (
    <div className="relative aspect-[600/420] w-full" data-occlude>
      <svg viewBox="0 0 600 420" className="absolute inset-0 h-full w-full" aria-hidden>
        {ossOrgs.map((o) => {
          const p = ORG_POS[o.id];
          const lit = o.id === selected;
          return (
            <g key={o.id}>
              <line x1={CENTER.x} y1={CENTER.y} x2={p.x} y2={p.y} stroke="#c9f4ec" strokeOpacity={lit ? 0.25 : 0.08} />
              <motion.line
                x1={CENTER.x}
                y1={CENTER.y}
                x2={p.x}
                y2={p.y}
                stroke="#6ff0d8"
                strokeWidth={lit ? 1.5 : 1}
                strokeOpacity={lit ? 0.9 : 0.3}
                strokeDasharray="2 14"
                animate={{ strokeDashoffset: [0, -32] }}
                transition={{ duration: lit ? 1 : 2.4, repeat: Infinity, ease: "linear" }}
              />
            </g>
          );
        })}
        {sats.map((s) => {
          const p = ORG_POS[s.org];
          const lit = s.org === selected;
          return (
            <g key={s.key} opacity={lit ? 1 : 0.45}>
              <line x1={p.x} y1={p.y} x2={s.x} y2={s.y} stroke="#c9f4ec" strokeOpacity={0.14} />
              <circle cx={s.x} cy={s.y} r={3.2} fill={s.state === "merged" ? "#6ff0d8" : "#021420"} stroke="#6ff0d8" strokeWidth={1.2} />
            </g>
          );
        })}
        {[0, 1.2, 2.4].map((delay) => (
          <circle key={delay} cx={CENTER.x} cy={CENTER.y} r={260} fill="none" stroke="#6ff0d8" strokeOpacity={0.35} strokeWidth={0.8} className="sonar" style={{ animationDelay: `${delay}s` }} />
        ))}
        <circle cx={CENTER.x} cy={CENTER.y} r={34} fill="none" stroke="#c9f4ec" strokeOpacity={0.14} />

      </svg>
      <span className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-xs font-semibold text-snow" style={{ left: "50%", top: "50%" }}>
        <JollyRoger className="h-12 w-12 drop-shadow-[0_0_14px_rgb(111_240_216/0.5)]" />
        Injora
      </span>

      {ossOrgs.map((o) => {
        const p = ORG_POS[o.id];
        const lit = o.id === selected;
        return (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            aria-pressed={lit}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3.5 py-1.5 text-[12px] backdrop-blur transition-all duration-500 md:text-[13px] ${
              lit ? "border-glow/70 bg-glow/15 text-snow shadow-[0_0_30px_rgb(111_240_216/0.35)]" : "border-line-strong bg-abyss/70 text-silver hover:border-white/40"
            }`}
            style={{ left: `${(p.x / 600) * 100}%`, top: `${(p.y / 420) * 100}%` }}
          >
            {o.name}
          </button>
        );
      })}
      <div className="absolute bottom-0 right-0 flex gap-4 text-xs text-mist">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-glow" /> merged</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-glow" /> open</span>
      </div>
    </div>
  );
}

function OrgDetail({ org }: { org: OssOrg }) {
  return (
    <div className="glass rounded-2xl p-6 md:p-7" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div key={org.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
          <p className="kicker !text-glow">{org.kind}</p>
          <a href={org.url} target="_blank" rel="noreferrer" className="group mt-3 inline-flex items-baseline gap-2">
            <span className="display-tight text-3xl text-snow md:text-4xl">{org.name}</span>
            <span className="out-arrow text-mist">↗</span>
          </a>
          <p className="mt-3 text-[15px] leading-relaxed text-silver">{org.description}</p>
          <ul className="mt-6 max-h-[420px] space-y-2 overflow-y-auto pr-1" data-lenis-prevent>
            {org.contributions.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer" className="group block rounded-xl border border-line bg-white/[0.02] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3 font-mono text-[10.5px]">
                    <span className="truncate text-mist">
                      {c.repo}#{c.number}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 ${c.state === "merged" ? "bg-glow/15 text-spray" : "border border-gold/40 text-gold"}`}>
                      {c.state === "merged" ? "Merged" : "Open"}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] leading-snug text-snow">
                    {c.title} <span className="out-arrow text-dim">↗</span>
                  </p>
                  {c.detail && <p className="mt-1.5 text-[13px] leading-relaxed text-mist">{c.detail}</p>}
                  {c.diff && <p className="mt-2 font-mono text-[10.5px] text-dim">{c.diff}</p>}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Heatmap() {
  const weeks = contributionSnapshot.weeks;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const level = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);
  const colors = ["rgba(200,240,235,0.06)", "rgba(111,240,216,0.25)", "rgba(111,240,216,0.48)", "rgba(111,240,216,0.75)", "#c9f4ec"];
  const cell = 11;
  const gap = 3;

  return (
    <Reveal className="mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h3 className="display-tight text-3xl text-snow md:text-4xl">A year at sea</h3>
          <p className="mt-2 text-lg text-silver">
            <span className="text-snow">{contributionSnapshot.total}</span> contributions from September 2025 to September 2026
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-mist">
          less
          {colors.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
          ))}
          more
        </div>
      </div>
      <div ref={ref} className="mt-6 overflow-x-auto pb-2" data-lenis-prevent-horizontal data-occlude>
        <svg
          viewBox={`0 0 ${weeks.length * (cell + gap)} ${7 * (cell + gap)}`}
          className="h-auto w-full min-w-[720px]"
          role="img"
          aria-label={`GitHub contribution calendar: ${contributionSnapshot.total} contributions in the last year`}
        >
          {weeks.map((w, x) =>
            w.map((n, y) => (
              <motion.rect
                key={`${x}-${y}`}
                x={x * (cell + gap)}
                y={y * (cell + gap)}
                width={cell}
                height={cell}
                rx={2}
                fill={colors[level(n)]}
                style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={inView ? { opacity: 1, scaleY: 1 } : undefined}
                transition={{ delay: x * 0.018 + (6 - y) * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            ))
          )}
        </svg>
      </div>
    </Reveal>
  );
}
