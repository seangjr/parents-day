"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Button,
  BUTTON_BASE,
  BUTTON_VARIANTS,
  ButtonContent,
} from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TransitionLink, TransitionTextLink } from "@/components/transition";
import { useParticipant } from "@/lib/participant";
import { WizardStep } from "@/components/quiz/wizard-step";
import { CodeDisplay } from "./code-display";
import type { CreateResponse } from "./types";
import { SplitReveal } from "@/components/animation/split-reveal";

/**
 * Step 1 of 4 — Create Family (Figma Mobile 3). A family surname mints a server
 * Family Code; the creator joins as the first member (ADR-0002) and the Family
 * is written to the participant store so every later step and the Submission
 * carry it. The code is shown to share, then Continue advances to Step 2.
 */
export function CreateFamily() {
  const { participant, ready, setFamily } = useParticipant();

  const [surname, setSurname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const trimmed = surname.trim();
  const displayName = trimmed ? `The ${trimmed} Family` : "";
  const nameValid = trimmed.length > 0;

  async function handleCreate() {
    if (!nameValid || busy || !ready || !participant.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) throw new Error("create failed");
      const created = (await res.json()) as CreateResponse;
      // The creator joins their own family as the first member (ADR-0002).
      await fetch("/api/family/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: created.code,
          participantId: participant.id,
        }),
      });
      setFamily({ code: created.code, name: displayName });
      setCode(created.code);
    } catch {
      setError("We couldn't create your family just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <WizardStep step={1} label="Create family" />

      <Field
        label="Family last name"
        placeholder="e.g. Tan"
        value={surname}
        onChange={(event) => setSurname(event.target.value)}
        hint={
          code
            ? undefined
            : "We\u2019ll form \u201cThe \u2026 Family\u201d and mint a code to share."
        }
        error={error ?? undefined}
        autoComplete="family-name"
        enterKeyHint="done"
        maxLength={40}
        disabled={busy || code !== null}
      />

      {code ? (
        <div className="flex flex-col items-center gap-5 rounded-card border border-lime/40 bg-lime/10 p-8 text-center shadow-glow backdrop-blur-sm">
          <SplitReveal as="p" className="font-condensed text-sm font-bold uppercase tracking-wide text-sage">
            Your family code
          </SplitReveal>
          <CodeDisplay code={code} />
          <SplitReveal as="p" className="text-sm leading-relaxed text-sage">
            Share this code with your family members so their results join the
            same cluster.
          </SplitReveal>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-4">
        {code ? (
          <TransitionLink
            href="/profile"
            className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "w-full")}
          >
            <ButtonContent>Continue</ButtonContent>
          </TransitionLink>
        ) : (
          <Button
            onClick={handleCreate}
            className="w-full"
            disabled={!nameValid || busy || !ready}
          >
            {busy ? "Creating\u2026" : "Create family"}
          </Button>
        )}
        <TransitionTextLink href="/family/join">
          I already have a code
        </TransitionTextLink>
      </div>
    </div>
  );
}
