import { LOVE_STYLE_ORDER, LOVE_STYLES, displayLabel, type LoveStyleId } from "@/lib/love-styles";
import { cn } from "@/lib/cn";

interface MixBarProps {
  /** Per-style member tallies (all five keys present, zeros included). */
  counts: Record<LoveStyleId, number>;
  className?: string;
}

/**
 * The Family Love Mix as a proportional bar plus a per-style count legend.
 * Raw counts only — no percentages at family scale (ADR-0003).
 */
export function MixBar({ counts, className }: MixBarProps) {
  const total = LOVE_STYLE_ORDER.reduce((sum, id) => sum + counts[id], 0);
  const present = LOVE_STYLE_ORDER.filter((id) => counts[id] > 0);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        role="img"
        aria-label="Proportional Family Love Mix"
        className="flex h-4 w-full overflow-hidden rounded-full bg-shadow/60"
      >
        {present.map((id) => {
          const pct = total > 0 ? (counts[id] / total) * 100 : 0;
          return (
            <span
              key={id}
              className="h-full"
              style={{ width: `${pct}%`, backgroundColor: LOVE_STYLES[id].hex }}
            />
          );
        })}
      </div>

      <ul className="flex flex-col gap-2">
        {present.map((id) => {
          const meta = LOVE_STYLES[id];
          const Icon = meta.icon;
          return (
            <li key={id} className="flex items-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full border"
                style={{
                  color: meta.hex,
                  borderColor: `${meta.hex}59`,
                  backgroundColor: `${meta.hex}14`,
                }}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex-1 font-condensed text-base font-bold uppercase tracking-wide text-cream">
                {displayLabel(meta)}
              </span>
              <span className="font-condensed text-lg font-bold tabular-nums text-lime">
                {counts[id]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
