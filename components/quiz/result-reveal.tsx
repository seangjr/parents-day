"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { LOVE_STYLES, displayLabel } from "@/lib/love-styles";
import { scoreQuiz } from "@/lib/scoring";
import {
  BUTTON_BASE,
  BUTTON_VARIANTS,
  ButtonContent,
} from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { FitText } from "@/components/fit-text";
import { TransitionLink, useTransitionRouter } from "@/components/transition";
import { WizardStep } from "./wizard-step";
import { useParticipant } from "@/lib/participant";
import { RESULT_COPY, ROJAK_COPY } from "@/lib/result-copy";

/**
 * Step 4 of 4 — Individual Result (Figma Mobile 8). Scores the five answers
 * on-device via the shared scoring engine (never waiting on the server,
 * ADR-0001) and reveals the Love Style via displayLabel (never a hardcoded
 * name). "Reveal on Wall" advances to the submitted screen, which fires the
 * best-effort Submission; "Retake quiz" clears the answers and loops back.
 */
export function ResultReveal() {
  const router = useRouter();
  const { navigate } = useTransitionRouter();
  const { participant, ready, hasProfile, hasFamily, completedAnswers, retake } =
    useParticipant();

  // Guard: bounce back through the flow if a prior step isn't done.
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

  if (!ready || !result) {
    return <p className="m-auto py-20 text-sage">Revealing…</p>;
  }

  const primary = LOVE_STYLES[result.primary];
  const Icon = primary.icon;
  const headline = result.isRojak ? "Rojak Love" : displayLabel(primary);
  const copy = result.isRojak ? ROJAK_COPY : RESULT_COPY[result.primary];

  function handleRetake() {
    retake();
    navigate("/quiz");
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-10 py-4">
      <WizardStep step={4} label="Your Result" centered />

      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-condensed text-sm font-bold uppercase tracking-[0.2em] text-sage">
          {participant.firstName
            ? `${participant.firstName}, your Love Style is`
            : "Your Love Style is"}
        </p>
        <FitText as="h1" lineClassName="font-display leading-none" className="text-lime">
          {headline}
        </FitText>
        {result.hybridWith ? (
          <Pill tint={LOVE_STYLES[result.hybridWith].hex}>
            with a bit of {displayLabel(LOVE_STYLES[result.hybridWith])}
          </Pill>
        ) : null}
        <span
          className="mt-2 flex size-20 items-center justify-center rounded-full border"
          style={{
            color: primary.hex,
            borderColor: `${primary.hex}59`,
            backgroundColor: `${primary.hex}14`,
          }}
        >
          <Icon className="size-9" aria-hidden />
        </span>
      </div>

      <p className="text-center text-base leading-relaxed text-cream">
        {copy.description}
      </p>

      {participant.family ? (
        <div className="flex flex-col gap-2 rounded-card border border-moss bg-lime/5 p-5">
          <p className="font-display text-xl text-lime">
            {participant.family.name}
          </p>
          <p className="text-sm text-sage">
            Your result will join your family cluster on the live wall.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <TransitionLink
          href="/submitted"
          className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "w-full")}
        >
          <ButtonContent>Reveal on Wall</ButtonContent>
        </TransitionLink>
        <button
          type="button"
          onClick={handleRetake}
          className="mx-auto rounded-xs text-sm text-lime/70 underline underline-offset-4 transition-colors duration-300 ease-smooth hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          Retake quiz
        </button>
      </div>
    </div>
  );
}
