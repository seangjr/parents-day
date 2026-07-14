import { type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SplitReveal } from "@/components/animation/split-reveal";

interface SectionHeadingProps {
  /** Section number — a number is zero-padded to two digits. */
  number?: string | number;
  title: ReactNode;
  className?: string;
  as?: ElementType;
  /** Disable only for headings whose text changes live. */
  animated?: boolean;
}

/** Numbered heading with a trailing accent rule. */
export function SectionHeading({
  number,
  title,
  className,
  as: Heading = "h2",
  animated = true,
}: SectionHeadingProps) {
  const label =
    typeof number === "number" ? String(number).padStart(2, "0") : number;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {label != null ? (
        <span className="font-condensed text-sm font-bold tracking-widest text-lime">
          {label}
        </span>
      ) : null}
      {animated ? (
        <SplitReveal
          as={Heading}
          reveal="lines"
          className="font-condensed text-2xl font-bold uppercase tracking-wide text-cream"
        >
          {title}
        </SplitReveal>
      ) : (
        <Heading className="font-condensed text-2xl font-bold uppercase tracking-wide text-cream">
          {title}
        </Heading>
      )}
      <span aria-hidden className="h-px flex-1 bg-sage/30" />
    </div>
  );
}
