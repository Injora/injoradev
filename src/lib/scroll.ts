import type Lenis from "lenis";

let lenis: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenis = l;
}

/** Smooth-scroll to a section id, falling back to native scrolling. */
export function scrollToId(id: string) {
  const el = id === "top" ? document.body : document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(id === "top" ? 0 : el, { offset: 0, duration: 1.6 });
  else if (id === "top") window.scrollTo({ top: 0 });
  else el.scrollIntoView();
  // Move focus for keyboard / screen-reader users without a second jump.
  if (id !== "top") {
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }
}
