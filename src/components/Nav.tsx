"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { identity, navItems, type SectionId } from "@/content/profile";
import { scrollToId } from "@/lib/scroll";

export function Mark({ className }: { className?: string }) {
  // Original mark: a crescent cut by a single blade line.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 1 1 15.5 3.2Z" fill="currentColor" opacity="0.9" />
      <path d="M4 20 20.5 3.5" stroke="#4da3ff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<SectionId>("top");
  const [open, setOpen] = useState(false);
  const clicks = useRef<number[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id as SectionId));
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: SectionId) => {
    setOpen(false);
    scrollToId(id);
  };

  const onLogo = () => {
    const now = performance.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1800), now];
    if (clicks.current.length >= 5) {
      clicks.current = [];
      window.dispatchEvent(new Event("injora:getsuga"));
    }
    go("top");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-[var(--gutter)] pt-4 md:pt-5">
      <nav
        aria-label="Primary"
        className={`flex w-full items-center justify-between transition-all duration-700 ease-[var(--ease-cinema)] ${
          scrolled ? "glass max-w-[760px] rounded-full py-2 pl-5 pr-2" : "max-w-[1600px] rounded-none border border-transparent py-2"
        }`}
      >
        <button onClick={onLogo} className="group flex items-center gap-2.5 text-snow" aria-label="Injora — back to top">
          <Mark className="h-5 w-5 transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:-rotate-12" />
          <span className="display text-[15px] tracking-[0.02em]">INJORA</span>
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
                aria-current={active === item.id ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                  active === item.id ? "text-snow" : "text-mist hover:text-snow"
                }`}
              >
                {active === item.id && (
                  <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={`mailto:${identity.email}`}
          className="hidden rounded-full bg-snow px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-black transition-colors hover:bg-ice md:inline-block"
        >
          Say hi
        </a>

        <button
          className="flex h-10 items-center gap-2 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-snow md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? "Close" : "Menu"}
          <span className="relative block h-2.5 w-4">
            <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-500 ${open ? "top-1 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-500 ${open ? "top-1 -rotate-45" : "top-2.5"}`} />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 -z-10 flex flex-col justify-between bg-void/95 px-[var(--gutter)] pb-10 pt-28 backdrop-blur-xl md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
          >
            <ul className="space-y-2">
              {navItems.map((item, i) => (
                <motion.li key={item.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(item.id);
                    }}
                    className="flex items-baseline gap-4 py-1"
                  >
                    <span className="font-mono text-xs text-dim">0{i + 1}</span>
                    <span className="display text-[13vw] text-snow">{item.label}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="flex gap-6 font-mono text-xs uppercase tracking-[0.16em] text-mist">
              <a href={identity.github} target="_blank" rel="noreferrer">GitHub</a>
              <a href={identity.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={`mailto:${identity.email}`}>Email</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
