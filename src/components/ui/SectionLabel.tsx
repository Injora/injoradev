"use client";

import { motion } from "motion/react";

export function SectionLabel({ index, title, jp }: { index: string; title: string; jp?: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[11px] text-volt">{index}</span>
      <motion.span
        className="h-px w-12 origin-left bg-white/25"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="eyebrow">{title}</span>
      {jp && <span className="jp text-sm text-dim">{jp}</span>}
    </div>
  );
}
