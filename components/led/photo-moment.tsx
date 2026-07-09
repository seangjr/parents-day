import { LOVE_STYLES } from "@/lib/love-styles";
import { cn } from "@/lib/cn";
import { Pill } from "@/components/ui/pill";
import type { FamilyMember } from "./family-constellation";

interface PhotoMomentProps {
  familyName: string;
  /** Family Archetype headline (e.g. "Rojak Love Family"). */
  archetype?: string;
  members: FamilyMember[];
  className?: string;
}

/**
 * LED Photo Moment — spotlights one family by name and mix, inviting them to
 * gather for a photo. Warm, celebratory framing with the script wordmark.
 */
export function PhotoMoment({
  familyName,
  archetype,
  members,
  className,
}: PhotoMomentProps) {
  return (
    <div
      className={cn(
        "relative flex animate-rise flex-col items-center gap-6 overflow-hidden rounded-card border border-lime/30 bg-shadow/70 p-10 text-center shadow-glow",
        className,
      )}
    >
      <span className="font-condensed text-xs font-bold uppercase tracking-[0.3em] text-lime">
        Photo Moment
      </span>
      <span className="font-display text-6xl leading-none text-cream">
        {familyName}
      </span>
      {archetype ? <Pill>{archetype}</Pill> : null}

      <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-4">
        {members.map((member, i) => {
          const meta = LOVE_STYLES[member.styleId];
          const Icon = meta.icon;
          return (
            <div key={i} className="flex w-20 flex-col items-center gap-1.5">
              <span
                className="flex size-12 items-center justify-center rounded-full border"
                style={{
                  color: meta.hex,
                  borderColor: `${meta.hex}59`,
                  backgroundColor: `${meta.hex}14`,
                }}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="font-condensed text-sm font-bold uppercase tracking-wide text-cream">
                {member.name}
              </span>
            </div>
          );
        })}
      </div>

      <p className="max-w-sm text-sage">
        Gather in front of the screen and strike a pose together.
      </p>
    </div>
  );
}
