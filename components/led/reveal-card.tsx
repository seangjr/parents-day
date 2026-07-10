import { LOVE_STYLES, displayLabel, type LoveStyleId } from "@/lib/love-styles";
import { cn } from "@/lib/cn";
import { Pill } from "@/components/ui/pill";

interface RevealCardProps {
  name: string;
  role: string;
  styleId: LoveStyleId;
  /** Optional selfie URL; falls back to the love-style icon frame. */
  photoUrl?: string;
  className?: string;
}

/**
 * LED Individual Reveal — a large glowing card spotlighting one participant's
 * name, role, and Love Style. Improves on the Figma with an accent aura and a
 * rise-in entrance.
 */
export function RevealCard({
  name,
  role,
  styleId,
  photoUrl,
  className,
}: RevealCardProps) {
  const meta = LOVE_STYLES[styleId];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "relative flex animate-rise flex-col items-center gap-6 overflow-hidden rounded-card border border-sage/20 bg-shadow/60 p-10 text-center",
        className,
      )}
      style={{ boxShadow: `0 0 4rem ${meta.hex}22` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-1/3 h-2/3 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${meta.hex}40, transparent)`,
        }}
      />
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="relative size-24 rounded-full object-cover"
          style={{ boxShadow: `0 0 0 2px ${meta.hex}` }}
        />
      ) : (
        <span
          className="relative flex size-24 items-center justify-center rounded-full border"
          style={{
            color: meta.hex,
            borderColor: `${meta.hex}59`,
            backgroundColor: `${meta.hex}14`,
          }}
        >
          <Icon className="size-12" aria-hidden />
        </span>
      )}
      <div className="relative flex flex-col items-center gap-2">
        <span className="font-condensed text-5xl font-bold uppercase tracking-wide text-cream">
          {name}
        </span>
        <Pill tint={meta.hex}>{role}</Pill>
      </div>
      <div className="relative flex flex-col items-center gap-1">
        <span
          className="font-condensed text-2xl font-bold uppercase tracking-wide"
          style={{ color: meta.hex }}
        >
          {displayLabel(meta)}
        </span>
        <span className="text-sm text-sage">{meta.descriptor}</span>
      </div>
    </div>
  );
}
