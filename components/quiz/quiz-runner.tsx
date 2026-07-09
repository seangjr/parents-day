"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useTransitionRouter } from "@/components/transition";
import { WizardStep } from "./wizard-step";
import { QUIZ_QUESTIONS } from "./questions";
import { QUESTION_COUNT, useParticipant } from "@/lib/participant";

/**
 * Step 3 of 4 — the five-question quiz (Figma Mobile 6/7). Reads/writes answers
 * to the participant store and shows per-question progress in the shared wizard
 * bar. Each question is forced-choice with large tap targets; selecting an
 * option lights it and enables Next. The final Next moves to the result, which
 * is scored entirely on-device (ADR-0001 client-first).
 */
export function QuizRunner() {
  const router = useRouter();
  const { navigate } = useTransitionRouter();
  const { participant, ready, hasProfile, setAnswer } = useParticipant();

  const [index, setIndex] = useState(0);
  const [seeded, setSeeded] = useState(false);

  // Guard: a profile is required before the quiz.
  useEffect(() => {
    if (ready && !hasProfile) router.replace("/profile");
  }, [ready, hasProfile, router]);

  // Resume at the first unanswered question once hydrated.
  useEffect(() => {
    if (ready && !seeded) {
      const firstUnanswered = participant.answers.findIndex((a) => a === null);
      setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
      setSeeded(true);
    }
  }, [ready, seeded, participant.answers]);

  if (!ready || !hasProfile) {
    return <p className="m-auto py-20 text-sage">Loading…</p>;
  }

  const question = QUIZ_QUESTIONS[index];
  const current = participant.answers[index];
  const isLast = index === QUESTION_COUNT - 1;

  function next() {
    if (!current) return;
    if (isLast) navigate("/result");
    else setIndex((i) => Math.min(QUESTION_COUNT - 1, i + 1));
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <WizardStep
        step={3}
        label={`Question ${index + 1} of ${QUESTION_COUNT}`}
        progress={(index + 1) / QUESTION_COUNT}
      />

      <h1
        key={question.id}
        className="font-display text-4xl leading-tight text-lime motion-safe:animate-rise"
      >
        {question.prompt}
      </h1>

      <div key={`options-${question.id}`} className="flex flex-col gap-3">
        {question.options.map((option) => {
          const selected = current === option.letter;
          return (
            <button
              key={option.letter}
              type="button"
              aria-pressed={selected}
              onClick={() => setAnswer(index, option.letter)}
              className={cn(
                "flex w-full items-center gap-3 rounded-card border p-5 text-left transition-all duration-300 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-olive-black",
                selected
                  ? "border-lime bg-lime/10 shadow-glow"
                  : "border-lime/30 bg-lime/5 hover:border-lime/60",
              )}
            >
              <span className="flex-1 text-cream">{option.text}</span>
              {selected ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-olive-black">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-2">
        <Button onClick={next} className="w-full" disabled={!current}>
          Next
        </Button>
      </div>
    </div>
  );
}
