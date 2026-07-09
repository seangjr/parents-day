"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { LOVE_STYLES } from "@/lib/love-styles";
import { scoreQuiz } from "@/lib/scoring";
import {
  Button,
  BUTTON_BASE,
  BUTTON_VARIANTS,
} from "@/components/ui/button";
import { LoveBadge } from "@/components/ui/love-badge";
import { Pill } from "@/components/ui/pill";
import { FitText } from "@/components/fit-text";
import { TransitionLink, useTransitionRouter } from "@/components/transition";
import { useParticipant } from "@/lib/participant";
import { submitResult } from "@/lib/submit-client";
import { RESULT_COPY, ROJAK_COPY } from "@/lib/result-copy";

/**
 * Client-first result screen. Scores the five answers on-device via the shared
 * scoring engine (never waiting on the server, ADR-0001) and reveals the Love
 * Style. "Send to big screen" is stubbed here — S06 wires the best-effort submit
 * and S07 the LED reveal; "View family mix" links to the family flow (S05).
 */
export function ResultReveal() {
  const router = useRouter();
  const { navigate } = useTransitionRouter();
  const { participant, ready, hasProfile, completedAnswers, retake } =
    useParticipant();
  const [sent, setSent] = useState(false);

  // Guard: bounce back if the profile or answers aren't there yet.
  useEffect(() => {
    if (!ready) return;
    if (!hasProfile) {
      router.replace("/start");
      return;
    }
    if (!completedAnswers) router.replace("/quiz");
  }, [ready, hasProfile, completedAnswers, router]);

  const result = useMemo(
    () => (completedAnswers ? scoreQuiz(completedAnswers) : null),
    [completedAnswers],
  );

  if (!ready || !result) {
    return <p className="m-auto py-20 text-sage">Revealing…</p>;
  }

  const primary = LOVE_STYLES[result.primary];
  const headline = result.isRojak ? "Rojak Love" : primary.name;
  const copy = result.isRojak ? ROJAK_COPY : RESULT_COPY[result.primary];

  function handleSend() {
    setSent(true);
    // Best-effort submit (ADR-0001): the result already shows on-device; this
    // only feeds the LED reveal + community aggregates. Family linking is S05,
    // so no familyCode here; the selfie Blob upload is a later slice, so no
    // selfieUrl — the API keeps both optional for when those land.
    if (participant.role) {
      submitResult({
        participantId: participant.id,
        firstName: participant.firstName,
        role: participant.role,
        primary: primary.id,
      });
    }
  }

  function handleRetake() {
    retake();
    navigate("/quiz");
  }

  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <div className="flex flex-col items-center gap-4 text-center">
        {participant.selfie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={participant.selfie}
            alt=""
            className="size-20 rounded-full border-2 object-cover"
            style={{ borderColor: `${primary.hex}80` }}
          />
        ) : null}
        <p className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-lime">
          {participant.firstName
            ? `${participant.firstName}, your Love Style is`
            : "Your Love Style is"}
        </p>
        <FitText
          as="h1"
          lineClassName="font-condensed font-bold uppercase tracking-wide"
          className="text-cream"
        >
          {headline}
        </FitText>
        {result.hybridWith ? (
          <Pill tint={LOVE_STYLES[result.hybridWith].hex}>
            with a bit of {LOVE_STYLES[result.hybridWith].name}
          </Pill>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-sage/20 bg-shadow/40 p-6">
        <LoveBadge styleId={result.primary} />
        <p className="text-lg text-cream">{copy.tagline}</p>
        <p className="text-sage">{copy.description}</p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {sent ? (
          <p
            role="status"
            className="rounded-xs border border-lime/40 bg-moss/30 px-4 py-3 text-center text-cream"
          >
            You’re heading to the wall
            {participant.firstName ? `, ${participant.firstName}` : ""} — look up
            at the big screen.
          </p>
        ) : (
          <Button onClick={handleSend} className="w-full">
            Send to big screen
          </Button>
        )}
        <TransitionLink
          href="/family"
          className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, "w-full")}
        >
          View family mix
        </TransitionLink>
        <button
          type="button"
          onClick={handleRetake}
          className="mx-auto mt-1 rounded-xs px-3 py-1 text-sm font-medium text-sage transition-colors duration-300 ease-smooth hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          Retake the quiz
        </button>
      </div>
    </div>
  );
}
