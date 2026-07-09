"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

export interface OdometerOptions {
  /** Roll duration per update (s). */
  duration?: number;
  /** GSAP ease. */
  ease?: string;
}

/** Build one digit column: a masked viewport over a stacked 0–9 track. */
function buildColumn(): HTMLSpanElement {
  const col = document.createElement("span");
  col.className = "odometer-digit";
  const track = document.createElement("span");
  track.className = "odometer-track";
  for (let n = 0; n <= 9; n++) {
    const num = document.createElement("span");
    num.className = "odometer-number";
    num.textContent = String(n);
    track.appendChild(num);
  }
  col.appendChild(track);
  return col;
}

/**
 * Programmatic odometer update — the live/fluctuating-number API (SPEC §Osmo
 * Number Odometer). Reconciles digit columns against `value` (columns added or
 * removed at the most-significant end so trailing digits keep rolling), then
 * rolls each 0–9 track to its target via `yPercent`. `container` must be the
 * `[data-odometer]` host element. Snaps instantly under reduced motion.
 */
export function updateOdometer(
  container: HTMLElement,
  value: number,
  options: OdometerOptions = {},
): void {
  const { duration = 1, ease = "power3.out" } = options;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const digits = Math.max(0, Math.round(value)).toString().split("");
  const needed = digits.length;
  let current = container.querySelectorAll(".odometer-digit").length;

  while (current < needed) {
    const col = buildColumn();
    container.insertBefore(col, container.firstChild);
    gsap.set(col.firstChild, { yPercent: 0 });
    current++;
  }
  while (current > needed) {
    if (!container.firstChild) break;
    container.removeChild(container.firstChild);
    current--;
  }

  const tracks = container.querySelectorAll<HTMLElement>(".odometer-track");
  tracks.forEach((track, i) => {
    const target = -(Number(digits[i]) * 10);
    if (reduce) {
      gsap.set(track, { yPercent: target });
    } else {
      gsap.to(track, {
        yPercent: target,
        duration,
        ease,
        delay: i * 0.05,
        overwrite: true,
      });
    }
  });

  container.setAttribute("data-odometer-value", digits.join(""));
}

interface OdometerProps extends OdometerOptions {
  /** Number to display; rolls whenever it changes. */
  value: number;
  className?: string;
}

/**
 * Declarative rolling number. Renders masked digit tracks and animates them to
 * `value` on every change. The animated digits are `aria-hidden`; the value is
 * exposed to assistive tech via a visually-hidden mirror.
 */
export function Odometer({ value, className, duration, ease }: OdometerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) updateOdometer(ref.current, value, { duration, ease });
  }, [value, duration, ease]);

  return (
    <span className={cn("relative inline-flex tabular-nums", className)}>
      <span ref={ref} data-odometer aria-hidden="true" />
      <span className="sr-only">{Math.max(0, Math.round(value))}</span>
    </span>
  );
}
