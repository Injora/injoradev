"use client";

import { motion } from "motion/react";

/** A small wave that draws itself in above a section heading. */
export function WaveMark() {
  return (
    <svg viewBox="0 0 64 10" className="h-2.5 w-16 text-glow" aria-hidden>
      <motion.path
        d="M1 5 Q9 0 17 5 T33 5 T49 5 T63 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
