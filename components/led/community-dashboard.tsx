import { LOVE_STYLE_LIST, displayLabel, type LoveStyleId } from "@/lib/love-styles";
import { cn } from "@/lib/cn";
import { Odometer } from "@/components/animation/odometer";

interface CommunityDashboardProps {
  /** Live count per Love Style (missing styles count as 0). */
  counts: Partial<Record<LoveStyleId, number>>;
  className?: string;
}

/**
 * LED Community Dashboard — the whole room's Love Style split with rolling
 * odometer counts, proportional bars, and community-scale percentages.
 */
export function CommunityDashboard({
  counts,
  className,
}: CommunityDashboardProps) {
  const total = LOVE_STYLE_LIST.reduce(
    (sum, meta) => sum + (counts[meta.id] ?? 0),
    0,
  );

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {LOVE_STYLE_LIST.map((meta) => {
        const count = counts[meta.id] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const Icon = meta.icon;
        return (
          <div key={meta.id} className="flex items-center gap-4">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xs border"
              style={{
                color: meta.hex,
                borderColor: `${meta.hex}59`,
                backgroundColor: `${meta.hex}14`,
              }}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-condensed text-lg font-bold uppercase tracking-wide text-cream">
                  {displayLabel(meta)}
                </span>
                <span className="flex items-baseline gap-2">
                  <span
                    className="font-condensed text-2xl font-bold leading-none"
                    style={{ color: meta.hex }}
                  >
                    <Odometer value={count} />
                  </span>
                  <span className="w-9 text-right text-sm tabular-nums text-sage">
                    {pct}%
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-xs bg-moss/40">
                <div
                  className="h-full rounded-xs transition-[width] duration-700 ease-smooth"
                  style={{ width: `${pct}%`, backgroundColor: meta.hex }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
