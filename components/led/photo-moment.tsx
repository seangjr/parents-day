import { LOVE_STYLES } from "@/lib/love-styles";
import { SplitReveal } from "@/components/animation/split-reveal";
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
        "relative flex motion-enter flex-col items-center gap-6 overflow-hidden rounded-card border border-lime/30 bg-shadow/70 p-10 text-center shadow-glow",
        className,
      )}
      style={{ animationDelay: "60ms" }}
    >
      <span
        className="motion-enter font-condensed text-xs font-bold uppercase tracking-[0.3em] text-lime"
        style={{ animationDelay: "120ms" }}
      >
        Photo Moment
      </span>
      <span
        className="motion-pop font-display text-6xl leading-none text-cream"
        style={{ animationDelay: "170ms" }}
      >
        {familyName}
      </span>
      {archetype ? (
        <Pill className="motion-enter" style={{ animationDelay: "220ms" }}>
          {archetype}
        </Pill>
      ) : null}

      <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-4">
        {members.map((member, i) => {
          const meta = LOVE_STYLES[member.styleId];
          const Icon = meta.icon;
          return (
            <div
              key={i}
              className="motion-pop flex w-20 flex-col items-center gap-1.5"
              style={{ animationDelay: `${260 + i * 40}ms` }}
            >
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

      <SplitReveal as="p" className="max-w-sm text-sage">
        Gather in front of the screen and strike a pose together.
      </SplitReveal>
    </div>
  );
}
