import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  /** Accent hex — tints text/border/background. Defaults to the sage token. */
  tint?: string;
}

/** Small accent-tinted label. Pass a love-style hex to colour it dynamically. */
export function Pill({ tint, className, style, children, ...props }: PillProps) {
  const tintStyle = tint
    ? {
        color: tint,
        backgroundColor: `${tint}1f`,
        borderColor: `${tint}59`,
      }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium leading-none",
        !tint && "border-sage/40 bg-sage/10 text-sage",
        className,
      )}
      style={{ ...tintStyle, ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
