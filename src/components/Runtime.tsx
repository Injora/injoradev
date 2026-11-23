"use client";

import dynamic from "next/dynamic";
import Lenis from "lenis";
import { useEffect, useState } from "react";
import { store } from "@/lib/store";
import { setLenis } from "@/lib/scroll";
import { Cursor } from "./ui/Cursor";
import { DepthGauge } from "./DepthGauge";
import { EasterEggs } from "./EasterEggs";
import { SceneFallback } from "./scene/SceneFallback";

// Three.js + the ocean live in their own chunk, loaded after hydration.
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

    let lenis: Lenis | null = null;
    if (!store.reducedMotion) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
      setLenis(lenis);
    }

    // Where the waterline sits in the document, so the ocean lines up with the hero.
    const measure = () => {
      const vh = window.innerHeight;
      const horizon = document.querySelector<HTMLElement>("[data-horizon]");
      const hero = document.getElementById("top");
      if (horizon) store.horizon = (horizon.getBoundingClientRect().top + window.scrollY) / vh;
      if (hero) store.split = (hero.getBoundingClientRect().bottom + window.scrollY) / vh;
      store.pages = document.documentElement.scrollHeight / vh;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);

    const onPointer = (e: PointerEvent) => {
      store.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let lastY = window.scrollY;
    const tick = (t: number) => {
      lenis?.raf(t);
      const y = window.scrollY;
      store.depth = y / window.innerHeight;
      store.velocity += (y - lastY - store.velocity) * 0.2;
      lastY = y;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    console.log(
      "%c INJORA %c source: github.com/Injora ",
      "background:#6ff0d8;color:#021420;font-weight:700;padding:4px 6px",
      "background:#04263a;color:#b4ccd3;padding:4px 6px"
    );

    return () => {
      cancelAnimationFrame(raf);
      mqReduce.removeEventListener("change", onReduce);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", measure);
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
      </div>
      <Cursor />
      <DepthGauge />
      <EasterEggs />
    </>
  );
}
