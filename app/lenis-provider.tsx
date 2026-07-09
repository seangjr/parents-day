"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lenis ↔ GSAP ScrollTrigger bridge. Keeps scroll-driven reveals (SplitReveal
 * et al.) locked to the smooth-scrolled position instead of the native scroll:
 *   - `lenis.on('scroll', ScrollTrigger.update)` recomputes triggers on every
 *     frame Lenis moves the page.
 *   - Lenis's RAF is driven off GSAP's single ticker (Lenis `autoRaf:false`,
 *     below), so smooth scroll and ScrollTrigger share one loop and never drift;
 *     `lagSmoothing(0)` keeps them in lockstep after tab-switch stalls.
 * Rendered inside <ReactLenis> so `useLenis()` reads the instance from context.
 */
function ScrollTriggerBridge() {
  const lenis = useLenis();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger); // idempotent — registered once effectively
    if (!lenis) return;

    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // next/font swaps in after first paint and shifts text metrics — most
    // visibly on iOS Safari — which can leave ScrollTrigger start positions
    // stale so scroll-driven reveals never fire. Recompute once fonts settle.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(raf);
    };
  }, [lenis]);

  return null;
}

// Global Lenis instance driving window scroll. `autoRaf:false` hands the RAF
// loop to GSAP's ticker (see ScrollTriggerBridge); `root` attaches Lenis to the
// window and renders children with no wrapper element.
export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ autoRaf: false }}>
      <ScrollTriggerBridge />
      {children}
    </ReactLenis>
  );
}
