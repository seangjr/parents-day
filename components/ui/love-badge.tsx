import { LOVE_STYLES, displayLabel, type LoveStyleId } from "@/lib/love-styles";
import { cn } from "@/lib/cn";

interface LoveBadgeProps {
  styleId: LoveStyleId;
  className?: string;
}

/** Icon frame + display label for a Love Style, driven by LOVE_STYLES. */
export function LoveBadge({ styleId, className }: LoveBadgeProps) {
  const meta = LOVE_STYLES[styleId];
  const Icon = meta.icon;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-card border"
        style={{
          color: meta.hex,
          borderColor: `${meta.hex}59`,
          backgroundColor: `${meta.hex}14`,
        }}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <span className="font-condensed text-xl font-bold uppercase tracking-wide text-cream">
        {displayLabel(meta)}
      </span>
    </div>
  );
}
