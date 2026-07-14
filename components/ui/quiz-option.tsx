import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface QuizOptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected state — adds the lime border + glow. */
  selected?: boolean;
  /** Answer letter (A–E) shown in the leading token. */
  letter?: string;
  children: ReactNode;
}

/** Large-tap-target quiz answer with default/selected states and a glow. */
export function QuizOption({
  selected = false,
  letter,
  children,
  className,
  type = "button",
  ...props
}: QuizOptionProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "group flex w-full touch-manipulation items-center gap-4 rounded-card border p-5 text-left transition-[border-color,background-color,box-shadow,scale] duration-200 ease-smooth motion-safe:active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-olive-black",
        selected
          ? "border-lime bg-moss/40 shadow-glow"
          : "border-sage/25 bg-shadow/40 hover:border-sage/60 hover:bg-moss/20",
        className,
      )}
      {...props}
    >
      {letter ? (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xs font-condensed text-lg font-bold transition-colors duration-200 ease-smooth motion-reduce:transition-none",
            selected
              ? "bg-lime text-olive-black"
              : "bg-moss/50 text-sage group-hover:text-cream",
          )}
        >
          {letter}
        </span>
      ) : null}
      <span className="flex-1 text-base text-cream">{children}</span>
    </button>
  );
}
