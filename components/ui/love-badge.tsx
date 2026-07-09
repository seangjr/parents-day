import { LOVE_STYLES, type LoveStyleId } from "@/lib/love-styles";
import { cn } from "@/lib/cn";
import { Pill } from "./pill";

interface LoveBadgeProps {
  styleId: LoveStyleId;
  className?: string;
  /** Show the descriptor pill under the name. */
  showDescriptor?: boolean;
}

/** Icon frame + name + descriptor pill for a Love Style, driven by LOVE_STYLES. */
export function LoveBadge({
  styleId,
  className,
  showDescriptor = true,
}: LoveBadgeProps) {
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
      <div className="flex flex-col items-start gap-1">
        <span className="font-condensed text-xl font-bold uppercase tracking-wide text-cream">
          {meta.name}
        </span>
        {showDescriptor ? <Pill tint={meta.hex}>{meta.descriptor}</Pill> : null}
      </div>
    </div>
  );
}
