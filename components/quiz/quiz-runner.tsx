"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QuizOption } from "@/components/ui/quiz-option";
import { useTransitionRouter } from "@/components/transition";
import { QUIZ_QUESTIONS } from "./questions";
import { QUESTION_COUNT, useParticipant } from "@/lib/participant";
import type { QuizAnswer } from "@/lib/love-styles";

/** Pause after a tap so the selected glow registers before advancing. */
const ADVANCE_MS = 300;

/**
 * The five-question quiz. Reads/writes answers to the participant store, shows a
 * progress indicator, and advances on tap. After the last answer it moves to the
 * result — which is scored entirely on-device (ADR-0001 client-first).
 */
export function QuizRunner() {
  const router = useRouter();
  const { navigate } = useTransitionRouter();
  const { participant, ready, hasProfile, setAnswer } = useParticipant();

  const [index, setIndex] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const timer = useRef<number | null>(null);

  // Guard: a profile is required before the quiz.
  useEffect(() => {
    if (ready && !hasProfile) router.replace("/start");
  }, [ready, hasProfile, router]);

  // Resume at the first unanswered question once hydrated.
  useEffect(() => {
    if (ready && !seeded) {
      const firstUnanswered = participant.answers.findIndex((a) => a === null);
      setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
      setSeeded(true);
    }
  }, [ready, seeded, participant.answers]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  if (!ready || !hasProfile) {
    return <p className="m-auto py-20 text-sage">Loading…</p>;
  }

  const question = QUIZ_QUESTIONS[index];
  const current = participant.answers[index];
  const isLast = index === QUESTION_COUNT - 1;

  function choose(letter: QuizAnswer) {
    setAnswer(index, letter);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (isLast) navigate("/result");
      else setIndex((i) => Math.min(QUESTION_COUNT - 1, i + 1));
    }, ADVANCE_MS);
  }

  function back() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between font-condensed text-xs font-bold uppercase tracking-widest text-sage">
          <span>
            Question {index + 1} of {QUESTION_COUNT}
          </span>
          {participant.firstName ? (
            <span className="text-sage/60">{participant.firstName}</span>
          ) : null}
        </div>
        <ProgressBar value={index + 1} max={QUESTION_COUNT} />
      </div>

      <h1
        key={question.id}
        className="font-condensed text-3xl font-bold uppercase leading-tight tracking-wide text-cream motion-safe:animate-rise"
      >
        {question.prompt}
      </h1>

      <div key={`options-${question.id}`} className="flex flex-col gap-3">
        {question.options.map((option) => (
          <QuizOption
            key={option.letter}
            letter={option.letter}
            selected={current === option.letter}
            onClick={() => choose(option.letter)}
          >
            {option.text}
          </QuizOption>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={back} disabled={index === 0}>
          Back
        </Button>
        <span className="text-sm text-sage/60">
          {current ? "Tap to change, or wait…" : "Pick the one that fits."}
        </span>
      </div>
    </div>
  );
}
