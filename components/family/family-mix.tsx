"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { FamilyConstellation } from "@/components/led/family-constellation";
import {
  Button,
  BUTTON_BASE,
  BUTTON_VARIANTS,
  ButtonContent,
} from "@/components/ui/button";
import { TransitionLink } from "@/components/transition";
import { CodeDisplay } from "./code-display";
import { JoinQr } from "./join-qr";
import { MixBar } from "./mix-bar";
import type { FamilyView } from "./types";
import { SplitReveal } from "@/components/animation/split-reveal";

/** How often the mix re-fetches so late joins/reveals appear live (ADR-0002). */
const POLL_MS = 5000;

type Status = "loading" | "ready" | "missing" | "error";

/**
 * The Family Love Mix screen. Below two revealed members it invites the rest of
 * the family (code + join-QR); once two have a result it shows the archetype
 * headline, the member constellation, and the proportional mix bar (ADR-0003).
 * Polls so late arrivals and freshly-submitted members appear without a reload.
 */
export function FamilyMix({ code }: { code: string }) {
  const [view, setView] = useState<FamilyView | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/family/${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setStatus("missing");
        return;
      }
      if (!res.ok) throw new Error("load failed");
      setView((await res.json()) as FamilyView);
      setStatus("ready");
    } catch {
      // Keep showing the last good mix on a transient poll failure.
      setStatus((prev) => (prev === "ready" ? "ready" : "error"));
    }
  }, [code]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), POLL_MS);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [load]);

  if (status === "loading") {
    return <p className="m-auto py-20 text-sage">Loading your family&hellip;</p>;
  }

  if (status === "missing") {
    return (
      <div className="m-auto flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sage">We couldn&rsquo;t find that family.</p>
        <TransitionLink href="/" className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost)}>
          <ButtonContent>Back to start</ButtonContent>
        </TransitionLink>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="m-auto flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sage">Something went wrong loading your family.</p>
        <Button onClick={() => void load()}>Try again</Button>
      </div>
    );
  }

  const mix = view.mix;

  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <header className="flex flex-col items-center gap-3 text-center">
        <SplitReveal as="span" className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-lime">
          Family Love Mix
        </SplitReveal>
        <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-cream">
          {view.name}
        </h1>
        <span className="inline-flex items-center gap-2 text-sage">
          <Users className="size-4" aria-hidden />
          {view.memberCount} {view.memberCount === 1 ? "member" : "members"}
        </span>
      </header>

      {mix ? (
        <div className="flex flex-col gap-8">
          <h2 className="text-center font-condensed text-2xl font-bold uppercase leading-tight tracking-wide text-lime">
            {mix.headline}
          </h2>
          <FamilyConstellation
            familyName={view.name}
            members={view.members.map((member) => ({
              name: member.firstName,
              styleId: member.primary,
            }))}
          />
          <MixBar counts={mix.counts} />
        </div>
      ) : (
        <InvitePanel view={view} />
      )}

      <div className="mt-auto flex flex-col gap-3">
        <TransitionLink href="/" className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, "w-full")}>
          <ButtonContent>Done</ButtonContent>
        </TransitionLink>
      </div>
    </div>
  );
}

/**
 * Shown until two members have revealed. Distinguishes "it's just you" from
 * "others joined but haven't finished the quiz", and always offers the code +
 * join-QR so more family can pile in.
 */
function InvitePanel({ view }: { view: FamilyView }) {
  const revealed = view.members.length;
  const waiting = view.memberCount >= 2;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 rounded-card border border-sage/20 bg-shadow/40 p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
          <UserPlus className="size-7" aria-hidden />
        </span>
        {waiting ? (
          <>
            <p className="text-lg text-cream">Your family is gathering.</p>
            <p className="text-sage">
              {revealed} of {view.memberCount} have finished the quiz. Your Love
              Mix unlocks once two of you have a result.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg text-cream">It&rsquo;s just you so far.</p>
            <p className="text-sage">
              Invite your family with the code or QR below — your Love Mix
              appears once two of you join and finish the quiz.
            </p>
          </>
        )}
      </div>

      <CodeDisplay code={view.code} />
      <JoinQr code={view.code} />
    </div>
  );
}
