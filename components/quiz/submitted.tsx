"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { LOVE_STYLES, displayLabel } from "@/lib/love-styles";
import { scoreQuiz } from "@/lib/scoring";
import {
  BUTTON_BASE,
  BUTTON_VARIANTS,
  ButtonContent,
} from "@/components/ui/button";
import { TransitionLink } from "@/components/transition";
import { useParticipant } from "@/lib/participant";
import { submitResult } from "@/lib/submit-client";

/**
 * Submitted / Look at Wall (Figma Mobile 9). The end of the participant flow:
 * on entry it fires the best-effort Submission (ADR-0001 — the result already
 * shows on-device, so this only feeds the LED reveal + community aggregates),
 * then confirms the Participant is on the wall with their Family. DONE opens the
 * live Family Love Mix.
 */
export function Submitted() {
  const router = useRouter();
  const { participant, ready, hasProfile, hasFamily, completedAnswers } =
    useParticipant();
  const sent = useRef(false);
  const [shared, setShared] = useState(false);

  // Guard: the whole flow must be complete to land here.
  useEffect(() => {
    if (!ready) return;
    if (!hasFamily) {
      router.replace("/family");
      return;
    }
    if (!hasProfile) {
      router.replace("/profile");
      return;
    }
    if (!completedAnswers) router.replace("/quiz");
  }, [ready, hasFamily, hasProfile, completedAnswers, router]);

  const result = useMemo(
    () => (completedAnswers ? scoreQuiz(completedAnswers) : null),
    [completedAnswers],
  );

  // Fire the Submission once on entry (fire-and-forget; idempotent by id).
  useEffect(() => {
    if (sent.current || !ready || !result) return;
    const { id, firstName, role, family } = participant;
    if (!role || !family) return;
    sent.current = true;
    submitResult({
      participantId: id,
      firstName,
      role,
      familyCode: family.code,
      primary: result.primary,
    });
  }, [ready, result, participant]);

  if (!ready || !result || !participant.family) {
    return <p className="m-auto py-20 text-sage">Sending to the wall&hellip;</p>;
  }

  const family = participant.family;
  const primary = LOVE_STYLES[result.primary];
  const resultLabel = result.isRojak ? "Rojak Love" : displayLabel(primary);

  async function shareCode() {
    const text = `Join our family on the Love Revealed wall — code ${family.code}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: family.name, text });
      } else {
        await navigator.clipboard.writeText(family.code);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked — the code stays readable.
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-12 py-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-6xl leading-none text-lime">
          You&rsquo;re on the wall
        </h1>
        <p className="text-base leading-relaxed text-cream">
          Look for {family.name} on the LED screen. Your result will appear with
          your family.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-card border border-lime/40 bg-lime/10 p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-sage">
            Submission Details
          </p>
          <p className="font-display text-3xl text-lime">{participant.firstName}</p>
        </div>
        <div className="flex items-center justify-between border-y border-moss py-4 text-sm">
          <span className="text-sage">Result</span>
          <span className="font-semibold text-lime">{resultLabel}</span>
        </div>
        <div className="flex h-14 items-center justify-center" aria-hidden>
          <svg viewBox="0 0 120 48" className="h-full w-auto">
            <line x1="34" y1="30" x2="60" y2="24" stroke={primary.hex} strokeOpacity={0.4} strokeWidth={1} />
            <line x1="60" y1="24" x2="86" y2="14" stroke={primary.hex} strokeOpacity={0.4} strokeWidth={1} />
            <circle cx="60" cy="24" r="6" fill={primary.hex} />
            <circle cx="34" cy="30" r="3" fill={primary.hex} fillOpacity={0.7} />
            <circle cx="86" cy="14" r="4" fill={primary.hex} fillOpacity={0.85} />
            <circle cx="96" cy="34" r="2.5" fill={primary.hex} fillOpacity={0.5} />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <TransitionLink
          href={`/family/${family.code}`}
          className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "w-full")}
        >
          <ButtonContent>Done</ButtonContent>
        </TransitionLink>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-sage">Family code</p>
          <span className="rounded-xs border border-moss bg-shadow/40 px-4 py-2 font-condensed text-2xl font-bold tracking-[0.15em] text-lime">
            {family.code}
          </span>
          <button
            type="button"
            onClick={shareCode}
            className="inline-flex items-center gap-1.5 rounded-xs text-sm text-lime underline underline-offset-4 transition-colors duration-300 ease-smooth hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
          >
            <Share2 className="size-4" aria-hidden />
            {shared ? "Shared" : "Share family code"}
          </button>
        </div>
      </div>
    </div>
  );
}
