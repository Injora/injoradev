"use client";

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { journey } from "@/content/profile";
import { MaskLines } from "../ui/Reveal";
import { WaveMark } from "../ui/WaveMark";

const STAGES = ["Learning", "Building", "Open Source", "Systems", "AI / ML"];

// A meandering route down the middle (viewBox 0 0 100 1000, stretched to the list).
const ROUTE = `M50 0 ${journey.map((_, i) => {
  const y = ((i + 1) / journey.length) * 1000;
  const x = i % 2 ? 47 : 53;
  return `S${x} ${y - 50} 50 ${y}`;
}).join(" ")}`;

export function Journey() {
  const ref = useRef<HTMLOListElement>(null);
  const path = useRef<SVGPathElement>(null);
  const ship = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.6", "end 0.6"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 22 });
  const travelled = useTransform(progress, (p) => Math.max(0, p) * 1000);

  // Sail the ship along the route as the reader scrolls.
  useMotionValueEvent(progress, "change", (p) => {
    const el = path.current;
    const box = ref.current;
    if (!el || !ship.current || !box) return;
    const len = el.getTotalLength();
    const a = el.getPointAtLength(Math.min(len, Math.max(0, p * len)));
    const b = el.getPointAtLength(Math.min(len, p * len + 4));
    const w = box.offsetWidth / 100;
    const h = box.offsetHeight / 1000;
    const angle = (Math.atan2((b.y - a.y) * h, (b.x - a.x) * w) * 180) / Math.PI + 90;
    ship.current.style.transform = `translate(${a.x * w}px, ${a.y * h}px) rotate(${angle}deg)`;
  });

  return (
    <section id="journey" aria-labelledby="journey-title" className="relative px-[var(--gutter)] py-32 md:py-44">
      <div className="mx-auto max-w-[1200px]">
        <WaveMark />
        <h2 id="journey-title" className="display-tight mt-8 text-[13vw] text-snow md:text-[6.4vw]">
          <MaskLines lines={["Charting the", "Grand Line."]} />
        </h2>
        <ul className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-mist">
          {STAGES.map((s, i) => (
            <motion.li
              key={s}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.7 }}
            >
              {i > 0 && <span className="text-dim">→</span>}
              <span className={i === STAGES.length - 1 ? "text-gold" : undefined}>{s}</span>
            </motion.li>
          ))}
        </ul>

        <ol ref={ref} className="relative mt-20">
          <svg className="absolute inset-y-0 left-[calc(10px-50%)] h-full w-full md:left-0" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden>
            <path d={ROUTE} fill="none" stroke="#c9f4ec" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="2 8" vectorEffect="non-scaling-stroke" />
            <clipPath id="route-travelled">
              <motion.rect x="0" y="0" width="100" height={travelled} />
            </clipPath>
            <path ref={path} d={ROUTE} fill="none" stroke="#6ff0d8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" clipPath="url(#route-travelled)" />
          </svg>
          <div className="pointer-events-none absolute inset-y-0 left-[calc(10px-50%)] z-10 w-full md:left-0" aria-hidden>
            <div ref={ship} className="absolute left-0 top-0 h-0 w-0">
            <div className="absolute left-0 top-0 h-9 w-9 -translate-x-1/2 -translate-y-1/2">
              <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-[0_0_10px_rgb(111_240_216/0.7)]">
                <path d="M12 2 C15 6 16 12 15 20 L9 20 C8 12 9 6 12 2 Z" fill="#e6f3f1" />
                <path d="M12 7 L12 16" stroke="#021420" strokeWidth="1.2" />
                <path d="M9 22 Q12 24 15 22" stroke="#6ff0d8" strokeWidth="1" fill="none" opacity="0.8" />
              </svg>
            </div>
            </div>
          </div>

          {journey.map((m, i) => {
            const right = i % 2 === 1;
            const future = m.date === "Next";
            const Title = m.href ? "a" : "span";
            return (
              <motion.li
                key={m.title}
                className={`relative mb-14 pl-12 md:mb-20 md:w-1/2 md:pl-0 ${right ? "md:ml-auto md:pl-16" : "md:pr-16 md:text-right"}`}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
                viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* the island marking this stop on the route */}
                {future ? (
                  // X marks the spot
                  <span aria-hidden className={`absolute -left-[5px] -top-1 block h-7 w-7 ${right ? "md:-left-[14px]" : "md:left-auto md:-right-[14px]"}`}>
                    <motion.svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-[0_0_10px_rgb(211_58_44/0.7)]">
                      {["M4 4 L20 20", "M20 4 L4 20"].map((d, k) => (
                        <motion.path
                          key={d}
                          d={d}
                          stroke="#d33a2c"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.4 + k * 0.35, ease: "easeOut" }}
                        />
                      ))}
                    </motion.svg>
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={`absolute left-[3px] top-1 block h-3.5 w-3.5 rounded-full border-2 border-glow bg-abyss ${right ? "md:-left-[7px]" : "md:left-auto md:-right-[7px]"}`}
                  >
                    <span className="sonar absolute -inset-2 rounded-full border border-glow/30" />
                  </span>
                )}
                <p className="text-sm font-semibold">
                  <span className={future ? "text-[#ff6b5e]" : "text-glow"}>{future ? "Next: the New World" : m.date}</span>
                  <span className="ml-3 text-mist">{m.stage}</span>
                </p>
                <h3 className="display-tight mt-3 text-2xl text-snow md:text-3xl">
                  <Title {...(m.href ? { href: m.href, target: "_blank", rel: "noreferrer", className: "wave-link" } : {})}>
                    {m.title}
                    {m.href && <span className="out-arrow ml-2 text-lg text-mist">↗</span>}
                  </Title>
                </h3>
                <p className={`mt-2 max-w-md text-[15px] leading-relaxed text-silver ${right ? "" : "md:ml-auto"}`}>{m.body}</p>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
