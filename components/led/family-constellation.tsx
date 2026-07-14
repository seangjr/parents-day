import { LOVE_STYLES, type LoveStyleId } from "@/lib/love-styles";
import { cn } from "@/lib/cn";
import { UserPlus } from "lucide-react";

export interface FamilyMember {
  name: string;
  styleId: LoveStyleId;
  role?: string;
}

interface FamilyConstellationProps {
  familyName: string;
  members: FamilyMember[];
  /** Joined members, including people who have not completed the Quiz yet. */
  memberCount?: number;
  className?: string;
}

/**
 * LED Family Reveal — members orbit the family name as a constellation, each a
 * love-style node wired to the centre. A richer take than the Figma's stacked
 * list, built to read from across a foyer.
 */
export function FamilyConstellation({
  familyName,
  members,
  memberCount,
  className,
}: FamilyConstellationProps) {
  const count = Math.max(memberCount ?? members.length, members.length);
  const radius = 37; // percent of the square
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    return {
      member: members[i] ?? null,
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    };
  });

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-lg", className)}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full text-sage/25"
        aria-hidden
      >
        {nodes.map((node, i) => (
          <line
            key={i}
            x1={50}
            y1={50}
            x2={node.x}
            y2={node.y}
            stroke="currentColor"
            strokeWidth={0.4}
            pathLength={1}
            strokeDasharray={1}
            className="motion-draw-line"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2">
        <div className="motion-pop flex size-full flex-col items-center justify-center rounded-full border border-lime/30 bg-shadow/80 p-2 text-center shadow-glow">
          <span className="font-display text-2xl leading-tight text-lime">
            {familyName}
          </span>
        </div>
      </div>

      {nodes.map(({ member, x, y }, i) => {
        const meta = member ? LOVE_STYLES[member.styleId] : null;
        const Icon = meta?.icon ?? UserPlus;
        return (
          <div
            key={member ? `${member.name}-${member.styleId}-${i}` : `pending-${i}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className="motion-pop flex flex-col items-center gap-1"
              style={{ animationDelay: `${120 + i * 40}ms` }}
            >
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-full border",
                  !meta && "border-sage/50 bg-sage/10 text-sage shadow-[0_0_1.5rem_#b7c9b333]",
                )}
                style={
                  meta
                    ? {
                        color: meta.hex,
                        borderColor: `${meta.hex}80`,
                        backgroundColor: `${meta.hex}14`,
                        boxShadow: `0 0 1.5rem ${meta.hex}33`,
                      }
                    : undefined
                }
              >
                <Icon className="size-6" aria-hidden />
              </span>
              <span className="font-condensed text-xs font-bold uppercase tracking-wide text-cream">
                {member?.name ?? "Joining…"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
