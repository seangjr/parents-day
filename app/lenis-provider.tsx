"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Global Lenis instance driving window scroll (equivalent to `new Lenis({ autoRaf: true })`).
// `root` attaches Lenis to the window and renders children with no wrapper element;
// `autoRaf` is on by default, so the requestAnimationFrame loop is managed internally.
export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Hardening (separate from the reduced-motion fix): next/font swaps in after
    // first paint and shifts text metrics — most visibly on iOS Safari — which can
    // leave ScrollTrigger start positions stale so scroll-driven reveals never
    // fire. Recompute once fonts settle. Does not touch Lenis's own scrolling.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return <ReactLenis root>{children}</ReactLenis>;
}
