"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Chip } from "@/components/ui/chip";
import { useTransitionRouter } from "@/components/transition";
import { ROLE_OPTIONS, useParticipant } from "@/lib/participant";
import type { Role } from "@/lib/scoring";
import { SelfieField } from "./selfie-field";

/**
 * Profile step: first name (required), role chip (required) and an optional,
 * skippable selfie. On submit it writes the profile to the participant store
 * and moves to the quiz. Entry is meant to stay under ~15s (SPEC).
 */
export function ProfileForm() {
  const { participant, ready, setProfile } = useParticipant();
  const { navigate } = useTransitionRouter();

  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Seed the form from the store once it hydrates (returning device / back-nav).
  useEffect(() => {
    if (ready && !seeded) {
      setFirstName(participant.firstName);
      setRole(participant.role);
      setSelfie(participant.selfie);
      setSeeded(true);
    }
  }, [ready, seeded, participant]);

  const nameValid = firstName.trim().length > 0;
  const valid = nameValid && role !== null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || role === null) {
      setAttempted(true);
      return;
    }
    setProfile({ firstName: firstName.trim(), role, selfie });
    navigate("/quiz");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Field
        label="First name"
        placeholder="e.g. Mei"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        hint="Just your first name is enough."
        error={
          attempted && !nameValid
            ? "We need a first name to reveal your style."
            : undefined
        }
        autoComplete="given-name"
        enterKeyHint="next"
        maxLength={40}
      />

      <div className="flex flex-col gap-2">
        <span className="font-condensed text-sm font-bold uppercase tracking-wide text-sage">
          Your role
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Your role">
          {ROLE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              selected={role === option.value}
              onClick={() => setRole(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        {attempted && role === null ? (
          <p className="text-sm text-peach">Pick the one that fits you best.</p>
        ) : null}
      </div>

      <SelfieField value={selfie} onChange={setSelfie} />

      <Button type="submit" className="mt-2 w-full" disabled={!valid}>
        Start the quiz
      </Button>
    </form>
  );
}
