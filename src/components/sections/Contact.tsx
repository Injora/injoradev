"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { identity } from "@/content/profile";
import { Mark } from "../Nav";
import { Magnetic } from "../ui/Magnetic";
import { DenDenMushi } from "../ui/Pirate";
import { MaskLines } from "../ui/Reveal";
import { WaveMark } from "../ui/WaveMark";

const LINKS = [
  { label: "GitHub", sub: "@Injora", href: identity.github },
  { label: "LinkedIn", sub: "Injora", href: identity.linkedin },
];

export function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [ringing, setRinging] = useState(false);
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
    <section id="contact" aria-labelledby="contact-title" className="relative px-[var(--gutter)] pt-32 md:pt-48">
      <div className="mx-auto max-w-[1500px]">
        <WaveMark />
        <h2 id="contact-title" className="display mt-10 text-[10.4vw] text-snow md:text-[8.6vw]">
          <MaskLines lines={["Let’s build", "something worth", "remembering."]} />
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <p className="kicker">Ring the Den Den Mushi</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <DenDenMushi ringing={ringing} className="mr-1 h-[4.5rem] w-24" />
              <Magnetic strength={0.2}>
                <a
                  href={`mailto:${identity.email}`}
                  onPointerEnter={() => setRinging(true)}
                  onPointerLeave={() => setRinging(false)}
                  onFocus={() => setRinging(true)}
                  onBlur={() => setRinging(false)}
                  className="group inline-flex items-center gap-3 rounded-full bg-snow px-7 py-4 text-lg font-semibold text-abyss shadow-[0_0_60px_-10px_rgb(111_240_216/0.6)] transition-colors hover:bg-glow md:text-xl"
                >
                  {identity.email}
                  <span className="out-arrow">↗</span>
                </a>
              </Magnetic>
              <button onClick={copy} className="rounded-full border border-line-strong px-5 py-3.5 text-sm font-semibold text-silver transition-colors hover:border-glow/60 hover:text-snow">
                <span aria-live="polite">{copied ? "Copied" : "Copy email"}</span>
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
                  className="group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-line bg-abyss/40 p-5 backdrop-blur transition-colors hover:border-glow/40"
                >
                  <span className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-t from-glow/15 to-transparent transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:scale-y-100" />
                  <span className="relative flex items-center justify-between text-sm font-semibold text-mist">
                    {l.label} <span className="out-arrow text-snow">↗</span>
                  </span>
                  <span className="display-tight relative text-xl text-snow">{l.sub}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* at the bottom of the sea, the name glows */}
      <div ref={ref} className="relative mt-32 overflow-hidden md:mt-48">
        <motion.p aria-hidden style={{ y: nameY, opacity: nameOpacity }} className="display glow-text select-none text-center text-[19.5vw] leading-[0.8]">
          INJORA
        </motion.p>
      </div>

      <footer className="mx-auto flex max-w-[1500px] flex-col gap-4 border-t border-line py-8 text-xs text-mist md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-2">
          <Mark className="h-5 w-5" /> © {new Date().getFullYear()} Injora
        </p>
        <p className="flex gap-6">
          <a href={identity.github} target="_blank" rel="noreferrer" className="wave-link">GitHub</a>
          <a href={identity.linkedin} target="_blank" rel="noreferrer" className="wave-link">LinkedIn</a>
        </p>
      </footer>
    </section>
  );
}
