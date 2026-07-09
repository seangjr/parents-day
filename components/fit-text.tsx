"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { initTextFitToWidth } from "@/lib/fit-text";
import { cn } from "@/lib/cn";

interface FitTextProps {
  children: ReactNode;
  /** Wrapper element (defaults to div). */
  as?: ElementType;
  /** Class for the wrapper (defines the width the text fills). */
  className?: string;
  /** Class for the fitted line itself. */
  lineClassName?: string;
}

/**
 * Fills its container's width with a single line of text using the Osmo
 * fit-to-width algorithm. Re-fits on resize and after fonts load.
 */
export function FitText({
  children,
  as: Wrapper = "div",
  className,
  lineClassName,
}: FitTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return initTextFitToWidth(ref.current);
  }, [children]);

  return (
    <Wrapper ref={ref} className={cn("w-full", className)}>
      <span
        data-fit-width
        className={cn("inline-block whitespace-nowrap", lineClassName)}
      >
        {children}
      </span>
    </Wrapper>
  );
}
