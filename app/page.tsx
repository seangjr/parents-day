import { cn } from "@/lib/cn";
import { FgaLogo } from "@/components/ui/fga-logo";
import { TracedScript } from "@/components/animation/traced-script";
import { TransitionLink } from "@/components/transition";
import { BUTTON_BASE, BUTTON_VARIANTS, ButtonContent } from "@/components/ui/button";

/**
 * Welcome (Figma Mobile 1) — the QR landing. Brand lockup + the "Love Revealed"
 * script wordmark, a one-line tagline, then BEGIN into the family-first wizard
 * (Step 1). A returning member with a code jumps straight to Join. Replaces the
 * old design-system landing; the gallery still lives at /design-system.
 */
export default function Welcome() {
  return (
    <main className="relative flex min-h-dvh flex-col justify-between overflow-hidden px-8 pb-10 pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/20 blur-3xl"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <FgaLogo className="h-5 w-auto text-lime" />
          <p className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-lime">
            Parents Day 2026
          </p>
        </div>

        <TracedScript className="h-40 w-full max-w-md text-lime sm:h-48" />

        <p className="max-w-sm text-base leading-relaxed text-cream">
          Discover how you and your family give and receive love. Answer 5 quick
          questions and join the live family wall.
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <TransitionLink
          href="/family"
          className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "w-full")}
        >
          <ButtonContent sparkle>Begin</ButtonContent>
        </TransitionLink>
        <TransitionLink
          href="/family/join"
          className="rounded-xs text-sm text-lime underline underline-offset-4 transition-colors duration-300 ease-smooth hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          Already have a family code?
        </TransitionLink>
        <p className="text-xs text-sage">Takes about 1 minute</p>
      </div>
    </main>
  );
}
