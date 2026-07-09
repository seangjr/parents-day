import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatLabelProps {
  label: ReactNode;
  value: ReactNode;
  /** Accent hex for the value. */
  accent?: string;
  className?: string;
}

/** LED building block — a small uppercase label over a large condensed value. */
export function StatLabel({ label, value, accent, className }: StatLabelProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-condensed text-xs font-bold uppercase tracking-widest text-sage">
        {label}
      </span>
      <span
        className="font-condensed text-3xl font-bold leading-none text-cream"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
