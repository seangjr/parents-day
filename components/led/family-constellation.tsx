import { LOVE_STYLES, type LoveStyleId } from "@/lib/love-styles";
import { cn } from "@/lib/cn";

export interface FamilyMember {
  name: string;
  styleId: LoveStyleId;
  role?: string;
}

interface FamilyConstellationProps {
  familyName: string;
  members: FamilyMember[];
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
  className,
}: FamilyConstellationProps) {
  const count = Math.max(1, members.length);
  const radius = 37; // percent of the square
  const nodes = members.map((member, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    return {
      member,
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
            strokeDasharray="1 1.5"
          />
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-lime/30 bg-shadow/80 p-2 text-center shadow-glow">
        <span className="font-display text-2xl leading-tight text-lime">
          {familyName}
        </span>
      </div>

      {nodes.map(({ member, x, y }, i) => {
        const meta = LOVE_STYLES[member.styleId];
        const Icon = meta.icon;
        return (
          <div
            key={i}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className="flex size-14 items-center justify-center rounded-full border"
              style={{
                color: meta.hex,
                borderColor: `${meta.hex}80`,
                backgroundColor: `${meta.hex}14`,
                boxShadow: `0 0 1.5rem ${meta.hex}33`,
              }}
            >
              <Icon className="size-6" aria-hidden />
            </span>
            <span className="font-condensed text-xs font-bold uppercase tracking-wide text-cream">
              {member.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
