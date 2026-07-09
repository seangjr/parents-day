"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import {
  Button,
  BUTTON_BASE,
  BUTTON_VARIANTS,
} from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SectionHeading } from "@/components/ui/section-heading";
import { TransitionLink } from "@/components/transition";
import { useParticipant } from "@/lib/participant";
import { CodeDisplay } from "./code-display";
import { JoinQr } from "./join-qr";
import { useMyFamily } from "./use-my-family";
import type { CreateResponse } from "./types";

/**
 * Create-a-Family screen: name → server-minted Family Code + a join-QR. The
 * creator is added as the first member (ADR-0002), then handed the code and QR
 * to share so the rest of the family can join across their own phones.
 */
export function CreateFamily() {
  const { participant, ready } = useParticipant();
  const { setCode: rememberFamily } = useMyFamily();

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const trimmed = name.trim();
  const nameValid = trimmed.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nameValid || busy || !ready || !participant.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("create failed");
      const { code } = (await res.json()) as CreateResponse;
      // The creator joins their own family as the first member.
      await fetch("/api/family/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, participantId: participant.id }),
      });
      rememberFamily(code);
      setCreated(code);
    } catch {
      setError("We couldn't create your family just now. Please try again.");
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="flex flex-1 flex-col gap-8 py-4">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-lime">
            Family created
          </span>
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-cream">
            {trimmed}
          </h1>
          <p className="text-sage">
            Share this Family Code — or the QR — so the rest of your family can
            join.
          </p>
        </header>

        <CodeDisplay code={created} />
        <JoinQr code={created} />

        <div className="mt-auto flex flex-col gap-3">
          <TransitionLink
            href={`/family/${created}`}
            className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "w-full")}
          >
            View our Love Mix
          </TransitionLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <header className="flex flex-col gap-3">
        <SectionHeading number={1} title="Start a family" />
        <p className="text-sage">
          Give your family a name. We&rsquo;ll mint a short Family Code the
          others can use to join you.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6" noValidate>
        <Field
          label="Family name"
          placeholder="e.g. The Tan Family"
          value={name}
          onChange={(event) => setName(event.target.value)}
          hint="Shown on your phones and the big screen. It doesn&rsquo;t have to be unique."
          error={error ?? undefined}
          autoComplete="off"
          enterKeyHint="done"
          maxLength={40}
        />

        <div className="mt-auto flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={!nameValid || busy || !ready}
          >
            {busy ? "Creating\u2026" : "Create family"}
          </Button>
          <TransitionLink
            href="/family/join"
            className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, "w-full")}
          >
            I have a code instead
          </TransitionLink>
        </div>
      </form>
    </div>
  );
}
