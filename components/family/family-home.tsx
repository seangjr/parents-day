"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { BUTTON_BASE, BUTTON_VARIANTS } from "@/components/ui/button";
import { TransitionLink } from "@/components/transition";
import { useMyFamily } from "./use-my-family";

/**
 * Family hub — the landing from the result screen's "View family mix". Offers
 * create/join, and when this device is already in a family, a shortcut back to
 * its mix.
 */
export function FamilyHome() {
  const { code, ready } = useMyFamily();

  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-lime">
          Family Love Mix
        </span>
        <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-cream">
          Link up your family
        </h1>
        <p className="text-sage">
          See how your whole family gives and receives love. Start a family, or
          join one with a code.
        </p>
      </header>

      {ready && code ? (
        <TransitionLink
          href={`/family/${code}`}
          className="flex items-center gap-4 rounded-card border border-lime/30 bg-moss/20 p-5 transition-colors duration-300 ease-smooth hover:border-lime/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-lime/40 bg-lime/10 text-lime">
            <Users className="size-6" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="font-condensed text-lg font-bold uppercase tracking-wide text-cream">
              Back to your family
            </span>
            <span className="text-sm tracking-[0.15em] text-sage">{code}</span>
          </span>
        </TransitionLink>
      ) : null}

      <div className="mt-auto flex flex-col gap-3">
        <TransitionLink
          href="/family/create"
          className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "w-full")}
        >
          Start a family
        </TransitionLink>
        <TransitionLink
          href="/family/join"
          className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, "w-full")}
        >
          Join with a code
        </TransitionLink>
      </div>
    </div>
  );
}
