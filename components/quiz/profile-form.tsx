"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Chip } from "@/components/ui/chip";
import { Checkbox } from "@/components/ui/checkbox";
import { useTransitionRouter } from "@/components/transition";
import { ROLE_OPTIONS, useParticipant } from "@/lib/participant";
import type { Role } from "@/lib/scoring";
import { SelfieField } from "./selfie-field";

/**
 * Step 2 of 4 — Profile + Selfie (Figma Mobile 5). Captures first name and role
 * (both required) plus an optional, always-skippable selfie. The consent toggle
 * is on by default and never blocks Continue (ADR-0005, internal event);
 * clearing it simply keeps the photo off the wall. On submit it writes the
 * profile to the store and advances to the quiz.
 */
export function ProfileForm() {
  const { participant, ready, hasFamily, setProfile } = useParticipant();
  const router = useRouter();
  const { navigate } = useTransitionRouter();

  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [consent, setConsent] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Family-first: no Family yet means Step 1 was skipped — send them back.
  useEffect(() => {
    if (ready && !hasFamily) router.replace("/family");
  }, [ready, hasFamily, router]);

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
    // Consent is the only lever we hold over the wall today: opting out keeps
    // the selfie off the Submission (name + result still feed the aggregates).
    setProfile({
      firstName: firstName.trim(),
      role,
      selfie: consent ? selfie : null,
    });
    navigate("/quiz");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6" noValidate>
      <Field
        label="First name"
        placeholder="e.g. Sarah"
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

      <div className="flex flex-col gap-2">
        <SelfieField value={selfie} onChange={setSelfie} />
        <p className="text-xs text-sage/70">
          Your photo may appear on the family wall if you allow it.
        </p>
      </div>

      <Checkbox
        checked={consent}
        onChange={(event) => setConsent(event.target.checked)}
        label="Show my first name, result, and photo on the event wall."
      />

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <Button type="submit" className="w-full" disabled={!valid}>
          Continue
        </Button>
        <p className="text-center text-xs italic text-sage/70">
          Photo is optional. You can still join the wall without one.
        </p>
      </div>
    </form>
  );
}
