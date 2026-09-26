"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { setMode, store } from "@/lib/store";

/**
 * Hidden interactions. None are required to use the site.
 *   · type "bankai"          → the blade's full release (black blade, red edge)
 *   · ↑↑↓↓←→←→BA             → reiatsu surge
 *   · click the logo 5 times → Getsuga Tenshō
 */
const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

export function EasterEggs() {
  const [event, setEvent] = useState<null | "bankai" | "surge" | "getsuga">(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let typed = "";
    let keys: string[] = [];

    const trigger = (kind: "bankai" | "surge" | "getsuga", ms: number) => {
      clearTimeout(timer.current);
      setEvent(kind);
      if (kind === "getsuga") store.slashAt = performance.now();
      else setMode(kind);
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
        trigger("surge", 6000);
        return;
      }
      if (k.length === 1) {
        typed = (typed + k).slice(-6);
        if (typed === "bankai") {
          typed = "";
          trigger("bankai", 9000);
        }
      }
    };
    const onLogo = () => trigger("getsuga", 2200);

    window.addEventListener("keydown", onKey);
    window.addEventListener("injora:getsuga", onLogo);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("injora:getsuga", onLogo);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {event === "bankai" ? "Bankai released." : event === "surge" ? "Reiatsu surge." : event === "getsuga" ? "Getsuga Tenshō." : ""}
      </p>
      <AnimatePresence>
        {event === "bankai" && (
          <motion.div
            key="bankai"
            className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2 } }}
            aria-hidden
          >
            <motion.div
              className="absolute inset-0 bg-ember mix-blend-screen"
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(40_0_6/0.55)_100%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
            />
            <motion.div
              className="relative text-center"
              initial={{ opacity: 0, scale: 1.3, filter: "blur(18px)" }}
              animate={{ opacity: [0, 1, 1, 0], scale: [1.3, 1, 1, 0.96], filter: ["blur(18px)", "blur(0px)", "blur(0px)", "blur(8px)"] }}
              transition={{ duration: 3.2, times: [0, 0.2, 0.75, 1], ease: "easeOut" }}
            >
              <div className="jp text-[22vw] leading-none text-snow/90 md:text-[14vw]">卍解</div>
              <div className="eyebrow mt-4 !text-ember">Bankai · full release</div>
            </motion.div>
          </motion.div>
        )}

        {event === "surge" && (
          <motion.div
            key="surge"
            className="pointer-events-none fixed inset-x-0 bottom-10 z-[70] flex justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            aria-hidden
          >
            <div className="glass rounded-full px-5 py-2 font-mono text-xs tracking-[0.2em] text-ice">
              <span className="jp mr-2">霊圧</span> REIATSU SURGE
            </div>
          </motion.div>
        )}

        {event === "getsuga" && (
          <motion.div key="getsuga" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" exit={{ opacity: 0 }} aria-hidden>
            <motion.svg
              viewBox="0 0 400 400"
              className="absolute top-1/2 h-[120vh] w-[120vh] -translate-y-1/2"
              initial={{ left: "-60%", opacity: 0, rotate: -18 }}
              animate={{ left: "110%", opacity: [0, 1, 1, 0], rotate: -8 }}
              transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }}
            >
              <defs>
                <radialGradient id="gt" cx="0.35" cy="0.5" r="0.7">
                  <stop offset="0.55" stopColor="#cfe6ff" stopOpacity="0.95" />
                  <stop offset="0.8" stopColor="#4da3ff" stopOpacity="0.6" />
                  <stop offset="1" stopColor="#e21d35" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path d="M150 20 Q360 200 150 380 Q290 200 150 20 Z" fill="url(#gt)" />
              <path d="M150 20 Q360 200 150 380" stroke="#fff" strokeWidth="2" fill="none" opacity="0.9" />
            </motion.svg>
            <motion.div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], y: 0 }}
              transition={{ duration: 2, times: [0, 0.3, 1] }}
            >
              <span className="jp text-2xl text-snow">月牙天衝</span>
              <span className="eyebrow ml-3">Getsuga Tenshō</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
