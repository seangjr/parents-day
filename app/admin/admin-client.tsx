"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SectionHeading } from "@/components/ui/section-heading";
import { LOVE_STYLES, LOVE_STYLE_ORDER } from "@/lib/love-styles";
import type { Role } from "@/lib/repo";
import type { AdminMode, AdminStateResponse } from "./types";

/** Poll the console state on the same cadence as the LED (ADR-0001). */
const POLL_MS = 2000;

const MODES: { id: AdminMode; label: string; hint: string }[] = [
  { id: "welcome", label: "Welcome", hint: "Idle join QR" },
  { id: "live", label: "Live", hint: "Reveals + dashboard" },
  { id: "photo-moment", label: "Photo Moment", hint: "Spotlight biggest family" },
  { id: "paused", label: "Paused", hint: "Hold the wall" },
];

const ROLE_LABEL: Record<Role, string> = {
  parent: "Parent",
  child: "Child",
  grandparent: "Grandparent",
  guardian: "Guardian",
  other: "Other",
};

const TOGGLE_BASE =
  "rounded-xs border px-4 py-3 text-left transition-colors duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-lime disabled:cursor-not-allowed disabled:opacity-50";

/**
 * The operator console (ADR-0006). Polls `/api/admin/state` for a live view and
 * posts to the admin action endpoints; the shared-secret cookie set by proxy.ts
 * authorises every request. All fine LED timing stays on the `/led` client — the
 * operator only sets coarse state here (ADR-0004).
 */
export function AdminConsole() {
  const [state, setState] = useState<AdminStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`state ${res.status}`);
      setState((await res.json()) as AdminStateResponse);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load state");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const act = useCallback(
    async (path: string, payload: unknown) => {
      setBusy(true);
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`${path} ${res.status}`);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const reset = useCallback(() => {
    const ok = window.confirm(
      "Wipe ALL event data — every Submission, Family, and count? This cannot be undone.",
    );
    if (ok) void act("/api/admin/reset", { confirm: true });
  }, [act]);

  if (!state) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-4xl items-center justify-center px-6 py-10">
        <p className="text-sage">
          {error ? `Couldn’t load the console: ${error}` : "Loading console…"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-lime">
            Parents Day 2026
          </p>
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-cream">
            Admin Console
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Pill tint={state.running ? "#F0F4A6" : "#FFDAB9"}>
            {state.running ? "Event running" : "Event stopped"}
          </Pill>
          <Button
            variant={state.running ? "ghost" : "primary"}
            disabled={busy}
            onClick={() => act("/api/admin/event", { running: !state.running })}
          >
            {state.running ? "Stop event" : "Start event"}
          </Button>
        </div>
      </header>

      {error ? (
        <p
          role="status"
          className="rounded-xs border border-peach/50 bg-peach/10 px-4 py-2 text-sm text-peach"
        >
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <SectionHeading number={1} title="LED mode" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MODES.map((m) => {
            const active = state.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={busy}
                aria-pressed={active}
                onClick={() => act("/api/admin/mode", { mode: m.id })}
                className={cn(
                  TOGGLE_BASE,
                  active
                    ? "border-lime bg-lime/15 text-lime"
                    : "border-sage/30 text-sage hover:border-sage hover:text-cream",
                )}
              >
                <span className="block font-condensed text-base font-bold uppercase tracking-wide">
                  {m.label}
                </span>
                <span className="mt-1 block text-xs opacity-80">{m.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-sage/70">
          Photo Moment spotlights the largest Family on the wall. The LED owns
          fine reveal timing (ADR-0004); these modes are the operator’s levers —
          per-participant forced reveals aren’t part of the LED contract.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          number={2}
          title={`Community · ${state.totals.total} counted`}
        />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LOVE_STYLE_ORDER.map((id) => {
            const meta = LOVE_STYLES[id];
            const Icon = meta.icon;
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-card border border-sage/20 px-4 py-3"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xs border"
                  style={{
                    color: meta.hex,
                    borderColor: `${meta.hex}59`,
                    backgroundColor: `${meta.hex}14`,
                  }}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex-1 font-condensed text-sm font-bold uppercase tracking-wide text-cream">
                  {meta.name}
                </span>
                <span className="font-condensed text-2xl font-bold tabular-nums text-lime">
                  {state.totals.counts[id]}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading number={3} title={`Families · ${state.families.length}`} />
        {state.families.length === 0 ? (
          <p className="text-sm text-sage/70">No families yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {state.families.map((family) => (
              <li
                key={family.code}
                className="flex flex-col gap-3 rounded-card border border-sage/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-condensed text-lg font-bold uppercase tracking-wide text-cream">
                    {family.name}
                  </span>
                  <Pill>{family.code}</Pill>
                  <span className="text-xs text-sage">
                    {family.submittedCount}/{family.memberCount} submitted
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {family.members.map((member) => (
                    <span
                      key={member.participantId}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border border-sage/30 px-3 py-1 text-xs",
                        member.removed
                          ? "text-sage/40 line-through"
                          : "text-cream",
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ backgroundColor: LOVE_STYLES[member.primary].hex }}
                      />
                      {member.firstName}
                      <span className="text-sage/60">
                        {ROLE_LABEL[member.role]}
                      </span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          number={4}
          title={`Submissions · ${state.submissions.length}`}
        />
        {state.removedCount > 0 ? (
          <p className="text-xs text-sage/70">{state.removedCount} hidden</p>
        ) : null}
        {state.submissions.length === 0 ? (
          <p className="text-sm text-sage/70">No submissions yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.submissions.map((sub) => {
              const meta = LOVE_STYLES[sub.primary];
              return (
                <li
                  key={sub.participantId}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-xs border px-4 py-3",
                    sub.removed
                      ? "border-peach/30 bg-peach/5"
                      : "border-sage/20",
                  )}
                >
                  <span
                    className={cn(
                      "font-condensed text-base font-bold uppercase tracking-wide",
                      sub.removed ? "text-sage/40 line-through" : "text-cream",
                    )}
                  >
                    {sub.firstName}
                  </span>
                  <span className="text-xs text-sage/60">
                    {ROLE_LABEL[sub.role]}
                  </span>
                  <Pill tint={meta.hex}>{meta.name}</Pill>
                  {sub.familyCode ? (
                    <span className="text-xs text-sage">{sub.familyCode}</span>
                  ) : null}
                  {sub.hasSelfie ? (
                    <span className="text-xs text-sage/60">selfie</span>
                  ) : null}
                  <span className="ml-auto text-xs tabular-nums text-sage/50">
                    {new Date(sub.ts).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      act("/api/admin/remove", {
                        participantId: sub.participantId,
                        removed: !sub.removed,
                      })
                    }
                    className={cn(
                      "rounded-xs px-2 py-1 text-xs font-medium underline underline-offset-2 transition-colors duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-lime disabled:opacity-50",
                      sub.removed
                        ? "text-sage hover:text-cream"
                        : "text-peach hover:text-peach/70",
                    )}
                  >
                    {sub.removed ? "Restore" : "Remove"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading number={5} title="Danger" />
        <div className="flex flex-wrap items-center gap-4 rounded-card border border-peach/30 bg-peach/5 px-4 py-4">
          <p className="flex-1 text-sm text-sage">
            Reset purges every Submission, Family, and count, plus the LED mode —
            nothing persists after the event (ADR-0005).
          </p>
          <Button variant="ghost" disabled={busy} onClick={reset}>
            Reset all data
          </Button>
        </div>
      </section>
    </main>
  );
}
