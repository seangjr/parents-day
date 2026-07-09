import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "ghost";

/** Shared base classes — exported so link-styled CTAs can reuse the look. */
export const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xs px-6 py-3 font-condensed text-base font-bold uppercase tracking-wide leading-none transition-colors duration-300 ease-smooth select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-olive-black disabled:pointer-events-none disabled:opacity-40";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-lime text-olive-black hover:bg-cream active:bg-sage",
  ghost:
    "border border-sage/40 bg-transparent text-cream hover:border-sage/70 hover:bg-sage/10 active:bg-sage/20",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)}
      {...props}
    />
  );
}
