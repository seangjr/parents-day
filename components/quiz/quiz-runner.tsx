"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuizOption } from "@/components/ui/quiz-option";
import { SplitReveal } from "@/components/animation/split-reveal";
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
    if (!ready || seeded) return;

    const firstUnanswered = participant.answers.findIndex((answer) => answer === null);
    const timer = window.setTimeout(() => {
      setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
      setSeeded(true);
    }, 0);
    return () => window.clearTimeout(timer);
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

      <SplitReveal
        key={question.id}
        as="h1"
        className="font-display text-4xl leading-tight text-lime"
      >
        {question.prompt}
      </SplitReveal>

      <div key={`options-${question.id}`} className="flex flex-col gap-3">
        {question.options.map((option, i) => {
          const selected = current === option.letter;
          return (
            <QuizOption
              key={option.letter}
              className="motion-enter"
              style={{ animationDelay: `${i * 45}ms` }}
              letter={option.letter}
              selected={selected}
              onClick={() => setAnswer(index, option.letter)}
            >
              {option.text}
            </QuizOption>
          );
        })}
      </div>

      <div className="motion-enter mt-auto pt-2" style={{ animationDelay: `${question.options.length * 45}ms` }}>
        <Button onClick={next} className="w-full" disabled={!current}>
          Next
        </Button>
      </div>
    </div>
  );
}
