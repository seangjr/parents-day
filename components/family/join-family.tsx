"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TransitionTextLink, useTransitionRouter } from "@/components/transition";
import { useParticipant } from "@/lib/participant";
import { WizardStep } from "@/components/quiz/wizard-step";
import type { FamilyView, JoinResponse } from "./types";
import { SplitReveal } from "@/components/animation/split-reveal";

/** The looked-up Family awaiting confirmation before we commit the join. */
interface Pending {
  code: string;
  name: string;
}

/**
 * Step 1 of 4 — Join Family (Figma Mobile 4). A typed Code (or a scanned
 * join-QR's `?code=`) is looked up — never joined — so the Participant can
 * confirm the Family Name first: a mistyped code must not drop them into the
 * wrong family, and there is no self-leave (ADR-0002). Continue commits the
 * join, writes the Family to the store, and advances to Step 2.
 */
export function JoinFamily() {
  const { participant, ready, setFamily } = useParticipant();
  const { navigate } = useTransitionRouter();

  const [code, setCode] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = code.trim().toUpperCase();
  const codeValid = normalized.length > 0;

  // Look up a Family for the confirm step — deliberately does NOT join.
  const lookup = useCallback(async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/family/${encodeURIComponent(value)}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setError("We couldn't find a family with that code. Check it and try again.");
        return;
      }
      if (!res.ok) throw new Error("lookup failed");
      const view = (await res.json()) as FamilyView;
      setPending({ code: view.code, name: view.name });
    } catch {
      setError("Something went wrong looking that up. Please try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  // A scanned join-QR arrives as ?code=TAN-K7 — prefill and jump to confirm.
  useEffect(() => {
    const scanned = new URLSearchParams(window.location.search).get("code");
    if (!scanned) return;

    const value = scanned.trim().toUpperCase();
    const timer = window.setTimeout(() => {
      setCode(value);
      void lookup(value);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lookup]);

  async function confirmJoin() {
    if (!pending || busy || !ready || !participant.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: pending.code, participantId: participant.id }),
      });
      const data = (await res.json()) as JoinResponse;
      if (data.ok) {
        setFamily({ code: pending.code, name: data.familyName });
        navigate("/profile");
        return;
      }
      setError(
        data.error === "full"
          ? `${pending.name} is already full (10 members).`
          : "That family code no longer exists.",
      );
      setPending(null);
    } catch {
      setError("We couldn't join you just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (pending) void confirmJoin();
    else if (codeValid) void lookup(normalized);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-8" noValidate>
      <WizardStep step={1} label="Join family" />

      <Field
        label="Family code"
        placeholder="e.g. TAN-K7"
        value={code}
        onChange={(event) => {
          setCode(event.target.value.toUpperCase());
          if (pending) setPending(null);
          if (error) setError(null);
        }}
        error={error ?? undefined}
        autoComplete="off"
        autoCapitalize="characters"
        enterKeyHint="go"
        maxLength={12}
        className="uppercase tracking-[0.2em]"
      />

      {pending ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <SplitReveal as="p" className="text-sage">You&rsquo;re joining</SplitReveal>
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-lime" />
            <span className="font-display text-3xl leading-tight text-lime">
              {pending.name}
            </span>
            <span aria-hidden className="h-px w-8 bg-lime" />
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-4">
        <Button type="submit" className="w-full" disabled={!codeValid || busy}>
          {busy ? (pending ? "Joining\u2026" : "Checking\u2026") : "Continue"}
        </Button>
        <TransitionTextLink href="/family/create">
          Create a new family instead
        </TransitionTextLink>
      </div>
    </form>
  );
}
