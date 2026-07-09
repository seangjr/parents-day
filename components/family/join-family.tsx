"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import {
  Button,
  BUTTON_BASE,
  BUTTON_VARIANTS,
} from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SectionHeading } from "@/components/ui/section-heading";
import { TransitionLink, useTransitionRouter } from "@/components/transition";
import { useParticipant } from "@/lib/participant";
import { useMyFamily } from "./use-my-family";
import type { FamilyView, JoinResponse } from "./types";

/** The looked-up Family awaiting confirmation before we commit the join. */
interface Pending {
  code: string;
  name: string;
  memberCount: number;
}

/**
 * Join-a-Family screen. A typed code or a scanned join-QR (`?code=`) is first
 * looked up (never joined) so the Participant can confirm the Family Name —
 * a mistyped code must not silently drop them into the wrong family, and there
 * is no self-leave (ADR-0002). "Yes" commits the join and opens the mix.
 */
export function JoinFamily() {
  const { participant, ready } = useParticipant();
  const { setCode: rememberFamily } = useMyFamily();
  const { navigate } = useTransitionRouter();

  const [code, setCodeInput] = useState("");
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
      setPending({ code: view.code, name: view.name, memberCount: view.memberCount });
    } catch {
      setError("Something went wrong looking that up. Please try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  // A scanned join-QR arrives as ?code=TAN-K7 — prefill and jump to confirm.
  useEffect(() => {
    const scanned = new URLSearchParams(window.location.search).get("code");
    if (scanned) {
      const value = scanned.trim().toUpperCase();
      setCodeInput(value);
      void lookup(value);
    }
  }, [lookup]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!codeValid || busy) return;
    void lookup(normalized);
  }

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
        rememberFamily(pending.code);
        navigate(`/family/${pending.code}`);
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

  // Confirm step — the guard against a mistyped code.
  if (pending) {
    return (
      <div className="flex flex-1 flex-col gap-8 py-4">
        <header className="flex flex-col gap-3">
          <SectionHeading number={2} title="Is this your family?" />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <p className="text-lg text-sage">You&rsquo;re joining</p>
          <h1 className="font-condensed text-4xl font-bold uppercase leading-tight tracking-wide text-cream">
            {pending.name}
          </h1>
          <p className="text-sage">
            {pending.memberCount === 0
              ? "You'll be the first one in."
              : `${pending.memberCount} ${
                  pending.memberCount === 1 ? "person is" : "people are"
                } already here.`}
          </p>
          {error ? (
            <p className="text-sm text-peach" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <Button onClick={confirmJoin} className="w-full" disabled={busy || !ready}>
            {busy ? "Joining\u2026" : "Yes, join this family"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setPending(null);
              setError(null);
            }}
            className="mx-auto rounded-xs px-3 py-1 text-sm font-medium text-sage transition-colors duration-300 ease-smooth hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
          >
            No, that&rsquo;s not us
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <header className="flex flex-col gap-3">
        <SectionHeading number={2} title="Join your family" />
        <p className="text-sage">
          Enter the Family Code you were given, or scan the join-QR on another
          member&rsquo;s phone.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6" noValidate>
        <Field
          label="Family code"
          placeholder="e.g. TAN-K7"
          value={code}
          onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
          error={error ?? undefined}
          autoComplete="off"
          autoCapitalize="characters"
          enterKeyHint="go"
          maxLength={12}
          className="uppercase tracking-[0.2em]"
        />

        <div className="mt-auto flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={!codeValid || busy}>
            {busy ? "Checking\u2026" : "Find my family"}
          </Button>
          <TransitionLink
            href="/family/create"
            className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, "w-full")}
          >
            Start a new family instead
          </TransitionLink>
        </div>
      </form>
    </div>
  );
}
