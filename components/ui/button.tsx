import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BUTTON_BODY_SPRITE, BUTTON_SPARKLE_SPRITE } from "@/lib/button-sprites";

type MotionButtonVariant = "primary" | "ghost";
type StaticButtonVariant = "surface" | "text" | "danger";
export type ButtonVariant = MotionButtonVariant | StaticButtonVariant;

/**
 * Container classes for a stop-motion button. Exported so link-styled CTAs can
 * wear the same look: `cn(BUTTON_BASE, BUTTON_VARIANTS[variant])` on the
 * element, with a `<ButtonContent>` inside it.
 */
export const BUTTON_BASE = "btn-motion";

export const BUTTON_VARIANTS: Record<MotionButtonVariant, string> = {
  primary: "btn-motion--primary",
  ghost: "btn-motion--ghost",
};

const STATIC_BUTTON_BASE =
  "inline-flex min-h-11 max-w-full touch-manipulation items-center justify-center gap-2 font-medium transition-[color,background-color,border-color,transform] duration-300 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-olive-black active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40";

const STATIC_BUTTON_VARIANTS: Record<StaticButtonVariant, string> = {
  surface:
    "rounded-card border border-sage/30 bg-shadow/40 px-4 py-3 text-cream hover:border-sage/60 hover:bg-moss/20",
  text:
    "rounded-xs px-1 text-sm text-lime underline underline-offset-4 hover:text-cream",
  danger:
    "rounded-xs px-1 text-sm text-peach underline underline-offset-4 hover:text-peach/70",
};

interface ButtonContentProps {
  /** Render the twinkling stop-motion sparkle before the label. */
  sparkle?: boolean;
  children: ReactNode;
}

/**
 * The layered inner structure shared by every stop-motion button: the
 * hand-drawn body that redraws frame-by-frame on hover, an optional twinkling
 * sparkle, and the (wiggling) label. Drop it inside any `.btn-motion` element —
 * the <Button> below, or a styled <Link> CTA. Purely decorative layers are
 * `aria-hidden`; the accessible name comes from `children`.
 */
export function ButtonContent({ sparkle, children }: ButtonContentProps) {
  return (
    <>
      <span className="btn-motion__body" aria-hidden="true">
        <svg
          className="btn-motion__body-svg"
          viewBox={BUTTON_BODY_SPRITE.viewBox}
          preserveAspectRatio="none"
        >
          <path d={BUTTON_BODY_SPRITE.d} />
        </svg>
      </span>
      {sparkle ? (
        <span className="btn-motion__icon" aria-hidden="true">
          <svg
            className="btn-motion__icon-svg"
            viewBox={BUTTON_SPARKLE_SPRITE.viewBox}
          >
            <path d={BUTTON_SPARKLE_SPRITE.d} />
          </svg>
        </span>
      ) : null}
      <span className="btn-motion__label">{children}</span>
    </>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Render the twinkling stop-motion sparkle before the label. */
  sparkle?: boolean;
}

export function Button({
  variant = "primary",
  sparkle,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const motion =
    variant === "primary" || variant === "ghost";
  const variantClass = motion
    ? cn(BUTTON_BASE, BUTTON_VARIANTS[variant])
    : cn(STATIC_BUTTON_BASE, STATIC_BUTTON_VARIANTS[variant]);

  return (
    <button
      type={type}
      className={cn(variantClass, className)}
      {...props}
    >
      {motion ? (
        <ButtonContent sparkle={sparkle}>{children}</ButtonContent>
      ) : (
        children
      )}
    </button>
  );
}
