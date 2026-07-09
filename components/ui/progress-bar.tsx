import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** Current progress. */
  value: number;
  /** Total (defaults to 100 for a percentage). */
  max?: number;
  className?: string;
  /** Show the "n / max" counter above the track. */
  showLabel?: boolean;
}

/** Quiz-style progress track — glowing lime fill, eased width transition. */
export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
}: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {showLabel ? (
        <div className="flex justify-between font-condensed text-xs font-bold uppercase tracking-wide text-sage">
          <span>Progress</span>
          <span>
            {Math.round(value)} / {max}
          </span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2 w-full overflow-hidden rounded-xs bg-moss/40"
      >
        <div
          className="h-full rounded-xs bg-lime shadow-glow transition-[width] duration-500 ease-smooth"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
