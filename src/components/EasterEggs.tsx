"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { setMode } from "@/lib/store";

/**
 * Hidden interactions. None are required to use the site.
 *   type "onepiece", or click the hat  → gold light floods the water
 *   ↑↑↓↓←→←→BA, or the logo 5 times    → a storm rolls in
 */
const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
const WORD = "onepiece";

export function EasterEggs() {
  const [event, setEvent] = useState<null | "storm" | "treasure">(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let typed = "";
    let keys: string[] = [];

    const trigger = (kind: "storm" | "treasure", ms: number) => {
      clearTimeout(timer.current);
      setEvent(kind);
      setMode(kind);
      timer.current = setTimeout(() => {
        setEvent(null);
        setMode("normal");
      }, ms);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, [contenteditable='true']")) return;
      const k = e.key.toLowerCase();
      keys = [...keys, k].slice(-KONAMI.length);
      if (keys.join() === KONAMI.join()) {
        keys = [];
        trigger("storm", 8000);
        return;
      }
      if (k.length === 1) {
        typed = (typed + k).slice(-WORD.length);
        if (typed === WORD) {
          typed = "";
          trigger("treasure", 7000);
        }
      }
    };
    const onStorm = () => trigger("storm", 8000);
    const onTreasure = () => trigger("treasure", 7000);

    window.addEventListener("keydown", onKey);
    window.addEventListener("injora:storm", onStorm);
    window.addEventListener("injora:treasure", onTreasure);
    return () => {
      window.removeEventListener("injora:treasure", onTreasure);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("injora:storm", onStorm);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {event === "storm" ? "A storm rolls in." : event === "treasure" ? "Treasure found." : ""}
      </p>
      <AnimatePresence>
        {event === "storm" && (
          <motion.div key="storm" className="pointer-events-none fixed inset-0 z-[70]" exit={{ opacity: 0 }} aria-hidden>
            <motion.div
              className="absolute inset-0 bg-[#dff6ff] mix-blend-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0, 0.45, 0, 0, 0.6, 0] }}
              transition={{ duration: 6, times: [0, 0.03, 0.08, 0.11, 0.16, 0.6, 0.63, 0.7] }}
            />
            <motion.svg
              viewBox="0 0 100 200"
              className="absolute left-[64%] top-0 h-[55vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 0.8, 0] }}
              transition={{ duration: 1, times: [0, 0.05, 0.25, 0.3, 0.6] }}
            >
              <path d="M60 0 L42 70 L58 72 L30 200 L48 95 L32 93 L52 0 Z" fill="#e8fbff" style={{ filter: "drop-shadow(0 0 12px #9fe8ff)" }} />
            </motion.svg>
          </motion.div>
        )}

        {event === "treasure" && (
          <motion.div
            key="treasure"
            className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2 } }}
            aria-hidden
          >
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(245_196_106/0.35),transparent_65%)]"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.2, opacity: [0, 1, 0.6] }}
              transition={{ duration: 2.4, ease: "easeOut" }}
            />
            <motion.p
              className="display relative px-6 text-center text-[12vw] text-gold md:text-[7vw]"
              style={{ textShadow: "0 0 40px rgb(245 196 106 / 0.6)" }}
              initial={{ opacity: 0, y: 30, filter: "blur(16px)" }}
              animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, -10], filter: ["blur(16px)", "blur(0px)", "blur(0px)", "blur(6px)"] }}
              transition={{ duration: 4, times: [0, 0.2, 0.8, 1], ease: "easeOut" }}
            >
              The One Piece is real.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
