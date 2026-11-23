"use client";

import { motion } from "motion/react";
import { identity } from "@/content/profile";
import { MaskLines, Reveal, ScrollText } from "../ui/Reveal";
import { WantedPoster } from "../ui/WantedPoster";
import { WaveMark } from "../ui/WaveMark";

const intro =
  "A full-stack developer who builds products end to end — *React* on the surface, *Node,* *Express* and *PostgreSQL* underneath. An open-source contributor with merged work in *cBioPortal* and *Sugar* *Labs.* Currently mastering *Java* and *Spring* *Boot,* and expanding toward *AI/ML.*";

const axes = ["Engineering", "Product", "Open Source", "AI"];

const profileLines: { k: string; v: string }[] = [
  { k: "name", v: `"Injora"` },
  { k: "crew", v: `"Full-Stack"` },
  { k: "flagship", v: `"JavaScript"` },
  { k: "frontend", v: `["React", "HTML", "CSS"]` },
  { k: "strongest", v: `"React + Node/Express + SQL"` },
  { k: "databases", v: `["PostgreSQL", "MySQL", "MongoDB", "Django"]` },
  { k: "heading", v: `"Mastering Java + Spring Boot"` },
  { k: "shoreLeave", v: `["anime", "movies", "comics"]` },
];

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative px-[var(--gutter)] py-32 md:py-48">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7">
          <WaveMark />
          <h2 id="about-title" className="display-tight mt-8 text-[13vw] text-snow md:text-[6.4vw]">
            <MaskLines lines={["Who is", "Injora?"]} />
          </h2>

          <ScrollText text={intro} className="mt-12 max-w-2xl text-2xl leading-[1.35] text-silver md:text-[2rem]" />

          <Reveal className="mt-14">
            <p className="kicker mb-4">Building where these meet</p>
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
                  {i > 0 && <span className="text-glow">+</span>}
                  <span className="display-tight">{a}</span>
                </motion.li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14 max-w-xl">
            <figure className="glass overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <figcaption className="font-mono text-[11px] text-mist">crew.ts</figcaption>
                <div className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-glow/70" />
                </div>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.9] md:text-[13px]" data-lenis-prevent-horizontal>
                <code>
                  <span className="text-glow">export const</span> <span className="text-snow">crewmate</span> <span className="text-dim">=</span> {"{"}
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
                      <span className="text-gold/90">{l.v}</span>
                      <span className="text-dim">,</span>
                    </motion.span>
                  ))}
                  {"};"}
                </code>
              </pre>
            </figure>
          </Reveal>
        </div>

        <div className="md:col-span-5 md:pt-24">
          <WantedPoster />

          <Reveal delay={0.1} className="mx-auto mt-12 max-w-[340px]">
            <blockquote className="border-l border-glow/50 pl-5 text-silver">
              <p className="display-tight text-2xl font-medium leading-snug text-snow">“{identity.quote}”</p>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
