"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TRACED_HERO, type TracedGlyph } from "@/lib/traced-hero";
import { cn } from "@/lib/cn";

interface TracedScriptProps {
  /** Glyph to trace. Defaults to the pre-generated "Love Revealed" wordmark. */
  glyph?: TracedGlyph;
  /** Class for the <svg> (controls size + color via currentColor). */
  className?: string;
  /** Stroke thickness in viewBox units. */
  strokeWidth?: number;
  /** Draw-on duration in seconds. */
  duration?: number;
  /** Delay before the draw begins, in seconds. */
  delay?: number;
  /** Fade a solid fill in once the outline finishes drawing. */
  fill?: boolean;
  /**
   * Changing this value re-runs the draw-on animation — handy for gallery
   * "replay" controls without remounting.
   */
  replayKey?: string | number;
}

/**
 * Draws the Oooh Baby script wordmark on via `stroke-dashoffset`, then fades a
 * solid fill in. Renders STATIC path data (`lib/traced-hero.ts`); no font or
 * opentype.js reaches the client. Honors `prefers-reduced-motion` by snapping
 * to the finished state.
 */
export function TracedScript({
  glyph = TRACED_HERO,
  className,
  strokeWidth = 1.5,
  duration = 2.4,
  delay = 0.15,
  fill = true,
  replayKey,
}: TracedScriptProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finalFill = fill ? 1 : 0;

    if (reduce) {
      gsap.set(path, { strokeDashoffset: 0, fillOpacity: finalFill });
      return;
    }

    const tl = gsap.timeline();
    tl.set(path, { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 });
    tl.to(path, {
      strokeDashoffset: 0,
      duration,
      delay,
      ease: "power2.inOut",
    });
    if (fill) {
      tl.to(path, { fillOpacity: 1, duration: 0.6, ease: "power1.out" }, "-=0.4");
    }

    return () => {
      tl.kill();
    };
  }, [glyph, duration, delay, fill, replayKey]);

  return (
    <svg
      viewBox={glyph.viewBox}
      role="img"
      aria-label={glyph.text}
      className={cn("block w-full overflow-visible text-cream", className)}
    >
      <title>{glyph.text}</title>
      <path
        ref={pathRef}
        d={glyph.d}
        pathLength={1}
        fill="currentColor"
        fillOpacity={0}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
