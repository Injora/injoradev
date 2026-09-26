"use client";

import dynamic from "next/dynamic";
import Lenis from "lenis";
import { useEffect, useState } from "react";
import { SCENE_ORDER, store } from "@/lib/store";
import { setLenis } from "@/lib/scroll";
import { computeBand, computeLane, drawDebug } from "@/lib/bladeLayout";
import { Cursor } from "./ui/Cursor";
import { EasterEggs } from "./EasterEggs";
import { SceneFallback } from "./scene/SceneFallback";

// Three.js + the scene live in their own chunk, loaded after hydration.
const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

type Capability = "pending" | "webgl" | "fallback";

function detectWebGL(): boolean {
  try {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData) return false;
    if ((nav.deviceMemory ?? 8) <= 2 && (navigator.hardwareConcurrency ?? 8) <= 2) return false;
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Runtime() {
  const [cap, setCap] = useState<Capability>("pending");

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    store.isMobile = mqMobile.matches;
    store.reducedMotion = mqReduce.matches;
    const onReduce = () => (store.reducedMotion = mqReduce.matches);
    mqReduce.addEventListener("change", onReduce);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability probe
    setCap(detectWebGL() ? "webgl" : "fallback");

    /* ── smooth scroll ── */
    let lenis: Lenis | null = null;
    if (!store.reducedMotion) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
      setLenis(lenis);
      (window as unknown as { lenis?: Lenis }).lenis = lenis;
    }

    /* ── section tracking ── */
    let bounds: number[] = [];
    const measure = () => {
      bounds = SCENE_ORDER.map((id) => {
        const el = document.querySelector<HTMLElement>(`[data-scene="${id}"]`);
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.bottom + window.scrollY;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);

    /* ── pointer ── */
    const onPointer = (e: PointerEvent) => {
      store.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* ── the element whose arrival shatters the blade (desktop or mobile variant) ── */
    const shatterAt = () => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-blade-shatter]")) if (el.offsetHeight > 0) return el;
      return null;
    };

    /* ── blade placement: re-solve a few times a second, when scrolling is calm ── */
    let lastSolve = 0;
    let debug: CanvasRenderingContext2D | null = null;
    if (location.search.includes("blade-debug")) {
      const c = document.createElement("canvas");
      c.style.cssText = "position:fixed;inset:0;z-index:95;pointer-events:none";
      c.width = innerWidth;
      c.height = innerHeight;
      document.body.appendChild(c);
      debug = c.getContext("2d");
    }
    const solve = (t: number, force = false) => {
      const calm = Math.abs(store.velocity) < 6;
      if (!force && t - lastSolve < (calm ? 250 : 600)) return;
      lastSolve = t;
      // During the finale the blade leaves its lane for the clearest band.
      if (store.shatter > 0.02) {
        store.finaleY = computeBand(window.innerWidth, window.innerHeight);
        return;
      }
      store.lane = computeLane(window.innerWidth, window.innerHeight, store.bladeWidthPx);
      store.laneReady = true;
      if (debug) {
        debug.canvas.width = innerWidth;
        debug.canvas.height = innerHeight;
        drawDebug(debug, innerWidth, innerHeight, store.lane);
      }
    };
    const onResize = () => solve(performance.now(), true);
    window.addEventListener("resize", onResize);

    /* ── frame loop: lenis + derived scroll state ── */
    let raf = 0;
    let lastY = window.scrollY;
    const tick = (t: number) => {
      lenis?.raf(t);
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      store.scroll = y / max;
      store.velocity += (y - lastY - store.velocity) * 0.2;
      lastY = y;
      // Hold each section's keyframe; cross-fade over one viewport at each boundary.
      const vc = y + vh / 2;
      let s = 0;
      for (let i = 0; i < bounds.length - 1; i++) {
        s += Math.min(1, Math.max(0, (vc - (bounds[i] - vh * 0.5)) / vh));
      }
      store.section = s;

      // Kyōka Suigetsu: fall down the centre → shatter as the Stack
      // constellation arrives → drift → reunite at the very bottom.
      const ease = (x: number) => {
        const c = Math.min(1, Math.max(0, x));
        return c * c * (3 - 2 * c);
      };
      const trigger = shatterAt();
      const top = trigger ? trigger.getBoundingClientRect().top : vh;
      store.fall = Math.min(1, Math.max(0, y / Math.max(1, top + y - vh)));
      store.shatter = ease((vh * 0.92 - top) / (vh * 0.4));
      store.reunite = ease((y - (max - vh * 0.9)) / (vh * 0.8));
      solve(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /* ── dev easter egg ── */
    console.log(
      "%c INJORA %c the code is my zanpakutō — source: github.com/Injora ",
      "background:#e21d35;color:#fff;font-weight:700;padding:4px 6px",
      "background:#0b0b0f;color:#c9ccd3;padding:4px 6px"
    );
    console.log("%c// some words carry spiritual pressure. try typing one.", "color:#5d616b");

    return () => {
      cancelAnimationFrame(raf);
      mqReduce.removeEventListener("change", onReduce);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("resize", onResize);
      debug?.canvas.remove();
      ro.disconnect();
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {cap === "webgl" && <Scene />}
        {cap === "fallback" && <SceneFallback />}
        {/* vignette keeps edges cinematic and text readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(3_3_4/0.75)_100%)]" />
      </div>
      <Cursor />
      <EasterEggs />
    </>
  );
}
