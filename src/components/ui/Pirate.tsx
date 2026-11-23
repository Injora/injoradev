"use client";

import { motion, useReducedMotion } from "motion/react";

const STRAW = "#f2c14e";
const STRAW_DARK = "#c9962c";
const BAND = "#d33a2c";
const BONE = "#f5f0e4";
const INK = "#021420";

/** A straw hat, drawn flat. */
export function StrawHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 46" className={className} aria-hidden>
      <ellipse cx="50" cy="36" rx="48" ry="9" fill={STRAW} />
      <ellipse cx="50" cy="36" rx="48" ry="9" fill="none" stroke={STRAW_DARK} strokeWidth="1.5" />
      <path d="M24 34 C24 10 34 2 50 2 C66 2 76 10 76 34 Z" fill={STRAW} />
      <path d="M24.6 27 C26 25 74 25 75.4 27 L75.8 34 C60 37 40 37 24.2 34 Z" fill={BAND} />
      <path d="M32 14 C40 10 60 10 68 14" fill="none" stroke={STRAW_DARK} strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

/** Original straw-hat Jolly Roger. */
export function JollyRoger({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={BONE} strokeWidth="5" strokeLinecap="round">
        <path d="M12 50 L52 26" />
        <path d="M12 26 L52 50" />
      </g>
      <g fill={BONE}>
        <circle cx="10" cy="24" r="3.4" />
        <circle cx="10" cy="52" r="3.4" />
        <circle cx="54" cy="24" r="3.4" />
        <circle cx="54" cy="52" r="3.4" />
        <circle cx="32" cy="34" r="14" />
        <rect x="24" y="40" width="16" height="11" rx="3" />
      </g>
      <circle cx="26.5" cy="35" r="3.6" fill={INK} />
      <circle cx="37.5" cy="35" r="3.6" fill={INK} />
      <path d="M32 39.5 L30 43 L34 43 Z" fill={INK} />
      <path d="M28 47 V51 M32 47 V51 M36 47 V51" stroke={INK} strokeWidth="1.4" />
      <ellipse cx="32" cy="23" rx="22" ry="4.5" fill={STRAW} />
      <path d="M20 22 C20 11 25 6 32 6 C39 6 44 11 44 22 Z" fill={STRAW} />
      <path d="M20.3 18.5 C24 17 40 17 43.7 18.5 L44 22 C38 23.4 26 23.4 20 22 Z" fill={BAND} />
    </svg>
  );
}

/** Den Den Mushi — the snail phone. Rings (shakes, "puru puru") while `ringing`. */
export function DenDenMushi({ ringing, className }: { ringing: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const ring = ringing && !reduce;
  return (
    <div className={`relative ${className ?? ""}`} aria-hidden>
      <motion.svg
        viewBox="0 0 80 60"
        className="h-full w-full overflow-visible"
        animate={ring ? { rotate: [0, -6, 6, -6, 6, 0], y: [0, -2, 0, -2, 0, 0] } : { rotate: 0, y: 0 }}
        transition={ring ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.25 } : { duration: 0.3 }}
      >
        {/* body */}
        <path d="M6 50 C6 44 12 42 20 42 L66 42 C74 42 78 46 76 52 C74 56 70 56 62 56 L14 56 C8 56 6 54 6 50 Z" fill="#e9c48f" stroke="#3b2a1a" strokeWidth="1.5" />
        {/* head */}
        <path d="M10 46 C8 36 10 28 18 26 C26 25 28 32 28 44 Z" fill="#e9c48f" stroke="#3b2a1a" strokeWidth="1.5" />
        {/* eye stalks */}
        <path d="M15 28 L11 14 M21 27 L23 13" stroke="#3b2a1a" strokeWidth="1.5" strokeLinecap="round" />
        <motion.g animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, times: [0, 0.92, 0.96, 1], repeat: Infinity }} style={{ transformOrigin: "17px 13px" }}>
          <circle cx="11" cy="13" r="3.4" fill="#fff" stroke="#3b2a1a" strokeWidth="1.2" />
          <circle cx="23" cy="12" r="3.4" fill="#fff" stroke="#3b2a1a" strokeWidth="1.2" />
          <circle cx="11.5" cy="13.5" r="1.4" fill="#3b2a1a" />
          <circle cx="23.5" cy="12.5" r="1.4" fill="#3b2a1a" />
        </motion.g>
        <path d="M14 38 Q18 41 22 38" fill="none" stroke="#3b2a1a" strokeWidth="1.3" strokeLinecap="round" />
        {/* shell */}
        <circle cx="50" cy="31" r="16" fill="#f4ead2" stroke="#3b2a1a" strokeWidth="1.5" />
        <path d="M50 31 m0 -3 a3 3 0 1 1 -3 3 a6 6 0 1 1 6 6 a9 9 0 1 1 -9 -9 a12 12 0 0 1 12 -6" fill="none" stroke="#c9962c" strokeWidth="1.4" />
        {/* receiver */}
        <motion.g animate={ring ? { y: [0, -3, 0] } : { y: 0 }} transition={ring ? { duration: 0.25, repeat: Infinity } : undefined}>
          <path d="M34 15 C34 9 40 8 42 12 L58 12 C60 8 66 9 66 15 C66 18 62 18 60 16 L40 16 C38 18 34 18 34 15 Z" fill="#1d1d22" />
        </motion.g>
        <path d="M60 17 Q72 22 66 34" fill="none" stroke="#1d1d22" strokeWidth="1.2" />
      </motion.svg>
      {ring && (
        <motion.span
          className="display-tight absolute bottom-full left-[55%] mb-0.5 whitespace-nowrap text-sm text-gold"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          puru puru puru
        </motion.span>
      )}
    </div>
  );
}
