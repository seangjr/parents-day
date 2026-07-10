"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { TRACED_HERO, type TracedGlyph } from "@/lib/traced-hero";
import { cn } from "@/lib/cn";

// useLayoutEffect on the client (fires before paint → no flash), useEffect on
// the server (SSR has no layout phase). Lets us apply the GSAP from-state
// before the first paint while keeping the render visible-by-default.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface TracedScriptProps {
  /** Wordmark to reveal. Defaults to the pre-generated "Love Revealed". */
  glyph?: TracedGlyph;
  /** Class for the <svg> (controls size + colour via currentColor). */
  className?: string;
  /** Stroke thickness in viewBox units. */
  strokeWidth?: number;
  /** Per-letter draw-on (trace) duration in seconds. */
  duration?: number;
  /** How long each letter takes to snap to a solid fill once traced. */
  fillDuration?: number;
  /** Delay before the first letter starts, in seconds. */
  delay?: number;
  /** Gap between consecutive letters starting, in seconds. */
  stagger?: number;
  /**
   * Changing this value re-runs the reveal — handy for gallery "replay"
   * controls without remounting.
   */
  replayKey?: string | number;
}

/**
 * Reveals the Oooh Baby script wordmark one letter at a time: each glyph is
 * traced on via `stroke-dashoffset`, then snaps to a solid fill, staggered left
 * to right. Renders STATIC per-glyph path data (`lib/traced-hero.ts`) — no font
 * or opentype.js reaches the client. Honors `prefers-reduced-motion` by showing
 * the finished wordmark at once.
 */
export function TracedScript({
  glyph = TRACED_HERO,
  className,
  strokeWidth = 1.5,
  duration = 0.4,
  fillDuration = 0.14,
  delay = 0.15,
  stagger = 0.26,
  replayKey,
}: TracedScriptProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useIsomorphicLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const letters = svg.querySelectorAll<SVGPathElement>("path");
    if (!letters.length) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce) {
      // Reduced-motion-safe: show the solid wordmark with a gentle opacity fade —
      // no per-letter tracing (that motion is what reduced-motion opts out of).
      gsap.set(letters, { strokeOpacity: 0, fillOpacity: 1 });
      gsap.fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" });
      return;
    }

    // Hide each letter behind a full-length dash (measured per glyph, in the
    // path's own user units), stroke visible, fill off — ready to trace. The
    // starting strokeOpacity=0 on the element avoids a first-paint flash. Runs
    // in a layout effect so this from-state lands before paint: no flash of the
    // visible-by-default solid fill, yet a JS/hydration failure leaves that
    // solid wordmark on screen instead of a blank hero.
    gsap.set(letters, {
      strokeOpacity: 1,
      fillOpacity: 0,
      strokeDasharray: (_i, el) => el.getTotalLength(),
      strokeDashoffset: (_i, el) => el.getTotalLength(),
    });

    const tl = gsap.timeline({ delay });
    letters.forEach((letter, i) => {
      const at = i * stagger;
      tl.to(letter, { strokeDashoffset: 0, duration, ease: "power1.inOut" }, at);
      // As the outline finishes drawing, the letter becomes solid.
      tl.to(
        letter,
        { fillOpacity: 1, duration: fillDuration, ease: "power1.out" },
        at + duration * 0.85,
      );
    });

    return () => {
      tl.kill();
    };
  }, [glyph, strokeWidth, duration, fillDuration, delay, stagger, replayKey]);

  return (
    <svg
      ref={svgRef}
      viewBox={glyph.viewBox}
      role="img"
      aria-label={glyph.text}
      className={cn("block w-full overflow-visible text-cream", className)}
    >
      <title>{glyph.text}</title>
      {/* Visible-by-default (fillOpacity=1): the solid wordmark is the no-JS /
          hydration-failure fallback; the layout effect sets the trace
          from-state before paint so the happy path still animates cleanly. */}
      {glyph.glyphs.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="currentColor"
          fillOpacity={1}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity={0}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
