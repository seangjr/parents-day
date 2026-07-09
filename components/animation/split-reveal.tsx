"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/cn";

type SplitUnit = "lines" | "words" | "chars";

interface SplitRevealProps {
  children: ReactNode;
  /** Wrapper element — the DEFAULT reveal for Geist / Big Shoulders headings. */
  as?: ElementType;
  className?: string;
  /** Split granularity. */
  reveal?: SplitUnit;
  /** Per-unit reveal duration (s). Defaults tuned per granularity. */
  duration?: number;
  /** Stagger between units (s). Defaults tuned per granularity. */
  stagger?: number;
  /** ScrollTrigger start position. */
  start?: string;
}

/** Sensible motion defaults per granularity — more units ⇒ tighter timing. */
const UNIT_DEFAULTS: Record<SplitUnit, { duration: number; stagger: number }> = {
  lines: { duration: 0.9, stagger: 0.12 },
  words: { duration: 0.8, stagger: 0.06 },
  chars: { duration: 0.6, stagger: 0.02 },
};

/**
 * Osmo Masked Text Reveal (GSAP SplitText). Splits into lines/words/chars, masks
 * each unit, and slides them up into view on scroll. The `data-split` marker
 * drives the FOUC guard in globals.css; `data-split-reveal` carries the
 * granularity. Adapted to React `useEffect` with SplitText.revert +
 * ScrollTrigger.kill cleanup; honors `prefers-reduced-motion`.
 */
export function SplitReveal({
  children,
  as: Wrapper = "h2",
  className,
  reveal = "words",
  duration,
  stagger,
  start = "top 85%",
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.registerPlugin(SplitText, ScrollTrigger);
    const unit = (el.getAttribute("data-split-reveal") as SplitUnit) || reveal;
    const timing = UNIT_DEFAULTS[unit];
    const dur = duration ?? timing.duration;
    const stag = stagger ?? timing.stagger;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced-motion-safe: reveal with a gentle opacity fade only — no split,
      // no vestibular slide — so the text still "arrives" instead of snapping.
      el.style.visibility = "visible";
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" });
      return;
    }

    const ctx = gsap.context(() => {
      SplitText.create(el, {
        type: unit,
        mask: unit,
        aria: "auto",
        autoSplit: true,
        onSplit(self) {
          el.style.visibility = "visible";
          const targets =
            unit === "lines"
              ? self.lines
              : unit === "words"
                ? self.words
                : self.chars;
          return gsap.from(targets, {
            yPercent: 110,
            duration: dur,
            stagger: stag,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start, once: true },
          });
        },
      });
    }, el);

    return () => {
      ctx.revert();
    };
  }, [children, reveal, duration, stagger, start]);

  return (
    <Wrapper
      ref={ref}
      data-split=""
      data-split-reveal={reveal}
      className={cn(className)}
    >
      {children}
    </Wrapper>
  );
}
