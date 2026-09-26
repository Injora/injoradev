import type { ReactNode } from "react";

/** A dark "screen" that hosts an interface study. */
export function Frame({ title, children, accent, note = "Interface study" }: { title: string; children: ReactNode; accent: string; note?: string }) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#07070a]/90 shadow-[0_60px_120px_-40px_rgb(0_0_0/0.9)]"
      style={{ boxShadow: `0 0 0 1px rgb(255 255 255 / 0.03), 0 60px 140px -50px ${accent}55` }}
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          <span className="font-mono text-[11px] text-silver">{title}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{note}</span>
      </div>
      <div className="relative flex-1 overflow-hidden">{children}</div>
      {/* screen glare */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.05),transparent_35%)]" />
    </div>
  );
}
