"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { identity } from "@/content/profile";
import { Mark } from "../Nav";
import { Magnetic } from "../ui/Magnetic";
import { MaskLines } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

const LINKS = [
  { label: "GitHub", sub: "@Injora", href: identity.github },
  { label: "LinkedIn", sub: "Injora", href: identity.linkedin },
];

export function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const nameY = useTransform(scrollYProgress, [0, 1], ["40%", "0%"]);
  const nameOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 1]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(identity.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${identity.email}`;
    }
  };

  return (
    <section id="contact" data-scene="contact" aria-labelledby="contact-title" className="relative px-[var(--gutter)] pt-32 md:pt-48">
      <div className="mx-auto max-w-[1500px]">
        <SectionLabel index="06" title="Contact" jp="穿界門" />
        <h2 id="contact-title" className="display mt-10 text-[10.4vw] text-snow md:text-[8.6vw]">
          <MaskLines lines={["Let’s build", "something worth", "remembering."]} />
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <p className="eyebrow">Email</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.2}>
                <a
                  href={`mailto:${identity.email}`}
                  className="group inline-flex items-center gap-3 rounded-full bg-snow px-7 py-4 text-lg text-black transition-colors hover:bg-ice md:text-xl"
                >
                  {identity.email}
                  <span className="out-arrow">↗</span>
                </a>
              </Magnetic>
              <button onClick={copy} className="rounded-full border border-line-strong px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-silver transition-colors hover:text-snow">
                <span aria-live="polite">{copied ? "Copied ✓" : "Copy"}</span>
              </button>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 md:col-span-5 md:col-start-8">
            {LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-line bg-white/[0.02] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.04]"
                >
                  <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
                    {l.label} <span className="out-arrow text-snow">↗</span>
                  </span>
                  <span className="display-tight text-xl text-snow">{l.sub}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* the world fades; the name remains */}
      <div ref={ref} className="relative mt-32 overflow-hidden md:mt-48">
        <motion.p aria-hidden style={{ y: nameY, opacity: nameOpacity }} className="display metal-text select-none text-center text-[19.5vw] leading-[0.8]">
          INJORA
        </motion.p>
      </div>

      <footer className="mx-auto flex max-w-[1500px] flex-col gap-4 border-t border-line py-8 font-mono text-[11px] text-dim md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-2">
          <Mark className="h-4 w-4 text-silver" /> © {new Date().getFullYear()} Injora
        </p>
        <p className="italic text-mist">“{identity.quote}”</p>
        <p>Next.js · Three.js · Motion</p>
      </footer>
    </section>
  );
}
