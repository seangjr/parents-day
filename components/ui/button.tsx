import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BUTTON_BODY_SPRITE, BUTTON_SPARKLE_SPRITE } from "@/lib/button-sprites";

export type ButtonVariant = "primary" | "ghost";

/**
 * Container classes for a stop-motion button. Exported so link-styled CTAs can
 * wear the same look: `cn(BUTTON_BASE, BUTTON_VARIANTS[variant])` on the
 * element, with a `<ButtonContent>` inside it.
 */
export const BUTTON_BASE = "btn-motion";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "btn-motion--primary",
  ghost: "btn-motion--ghost",
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
  return (
    <button
      type={type}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)}
      {...props}
    >
      <ButtonContent sparkle={sparkle}>{children}</ButtonContent>
    </button>
  );
}
