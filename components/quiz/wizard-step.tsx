import { cn } from "@/lib/cn";

interface WizardStepProps {
  /** Which of the four wizard steps this screen is (1–4). */
  step: 1 | 2 | 3 | 4;
  /** Short label shown after "STEP n OF 4 •" (Figma Mobile 2–8). */
  label: string;
  /** Fractional fill (0–1) of the current step's segment. Defaults to full. */
  progress?: number;
  /** Center the caption + bar (the result step is centered). */
  centered?: boolean;
  className?: string;
}

const TOTAL_STEPS = 4;

/**
 * Shared wizard chrome for the family-first 4-step participant flow (Figma
 * Mobile 2–8): a "STEP n OF 4 • {label}" caption over a four-segment progress
 * bar. Segments before the current step fill solid; the current segment fills
 * to `progress` (the quiz passes its question fraction) so the bar only ever
 * moves forward across the flow.
 */
export function WizardStep({
  step,
  label,
  progress = 1,
  centered = false,
  className,
}: WizardStepProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div className={cn("flex w-full flex-col gap-2", centered && "items-center", className)}>
      <p
        className={cn(
          "font-condensed text-xs font-bold uppercase tracking-[0.15em] text-sage",
          centered && "text-center",
        )}
      >
        Step {step} of {TOTAL_STEPS} <span className="text-sage/50">&bull;</span> {label}
      </p>
      <div
        className="flex h-0.5 w-full gap-1"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Step ${step} of ${TOTAL_STEPS}`}
      >
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const n = i + 1;
          const fill = n < step ? 1 : n === step ? clamped : 0;
          const isCurrent = n === step;
          return (
            <span
              key={n}
              className="relative h-full flex-1 overflow-hidden rounded-full bg-moss"
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-lime transition-[width] duration-300 ease-smooth motion-reduce:transition-none",
                  isCurrent && "shadow-glow",
                )}
                style={{ width: `${fill * 100}%` }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
