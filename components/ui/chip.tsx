import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected state — fills the chip with the lime accent. */
  selected?: boolean;
  children: ReactNode;
}

/** Small selectable pill toggle (e.g. role picker, filters). */
export function Chip({
  selected = false,
  children,
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime",
        selected
          ? "border-lime bg-lime text-olive-black"
          : "border-sage/30 bg-transparent text-sage hover:border-sage/60 hover:text-cream",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
