"use client";

import { motion } from "motion/react";
import { identity } from "@/content/profile";
import { MaskLines, Reveal, ScrollText } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

const intro =
  "A full-stack developer who builds products end to end — *React* on the surface, *Node,* *Express* and *PostgreSQL* underneath. An open-source contributor with merged work in *cBioPortal* and *Sugar* *Labs.* Currently mastering *Java* and *Spring* *Boot,* and expanding toward *AI/ML.*";

const axes = ["Engineering", "Product", "Open Source", "AI"];

/** The soul profile from the GitHub README, rendered as it appears there. */
const profileLines: { k: string; v: string; c?: string }[] = [
  { k: "name", v: `"Injora"` },
  { k: "division", v: `"Full-Stack Division"` },
  { k: "zanpakuto", v: `"JavaScript"`, c: "main language" },
  { k: "shikai", v: `["React", "HTML", "CSS"]`, c: "frontend form" },
  { k: "bankai", v: `"React + Node/Express + SQL"`, c: "strongest" },
  { k: "kido", v: `["PostgreSQL", "MySQL", "MongoDB", "Django"]` },
  { k: "currentMission", v: `"Mastering Java + Spring Boot"` },
  { k: "offDuty", v: `["anime", "movies", "comics"]` },
];

export function About() {
  return (
    <section id="about" data-scene="about" aria-labelledby="about-title" className="relative px-[var(--gutter)] py-32 md:py-48">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7">
          <SectionLabel index="01" title="Soul profile" jp="魂" />
          <h2 id="about-title" className="display-tight mt-8 text-[13vw] text-snow md:text-[6.4vw]">
            <MaskLines lines={["Who is", "Injora?"]} />
          </h2>

          <ScrollText text={intro} className="mt-12 max-w-2xl text-2xl leading-[1.35] text-silver md:text-[2rem]" />

          <Reveal className="mt-14">
            <p className="eyebrow mb-4">Building at the intersection of</p>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xl text-snow md:text-2xl">
              {axes.map((a, i) => (
                <motion.li
                  key={a}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.8 }}
                >
                  {i > 0 && <span className="text-volt">×</span>}
                  <span className="display-tight">{a}</span>
                </motion.li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="md:col-span-5 md:pt-40">
          <Reveal>
            <figure className="glass overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ember/70" />
                </div>
                <figcaption className="font-mono text-[11px] text-dim">soul-reaper.js</figcaption>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.9] md:text-[13px]" data-lenis-prevent-horizontal>
                <code>
                  <span className="text-volt">const</span> <span className="text-snow">soulReaper</span> <span className="text-dim">=</span> {"{"}
                  {"\n"}
                  {profileLines.map((l, i) => (
                    <motion.span
                      key={l.k}
                      className="block"
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.07, duration: 0.6 }}
                    >
                      {"  "}
                      <span className="text-silver">{l.k}</span>
                      <span className="text-dim">: </span>
                      <span className="text-ice">{l.v}</span>
                      <span className="text-dim">,</span>
                      {l.c && <span className="text-dim/80"> {"// " + l.c}</span>}
                    </motion.span>
                  ))}
                  {"};"}
                </code>
              </pre>
            </figure>
          </Reveal>

          <Reveal delay={0.1} className="mt-6">
            <blockquote className="border-l border-ember/60 pl-5 text-silver">
              <p className="text-lg italic leading-relaxed">“{identity.quote}”</p>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
