"use client";

import type { LoveStyleId } from "@/lib/love-styles";
import type { Role } from "@/lib/repo";

/**
 * The client-first submit path (ADR-0001). The personal result is already shown
 * from on-device scoring, so posting the Submission to the server is
 * fire-and-forget with retry: it only feeds the LED reveal + community
 * aggregates, never the Participant's own result. Failures degrade silently
 * after a bounded number of attempts.
 */

/** What the client posts; the server stamps `ts` and normalises nullables. */
export interface SubmitPayload {
  participantId: string;
  firstName: string;
  role: Role;
  familyCode?: string | null;
  primary: LoveStyleId;
  selfieUrl?: string | null;
}

const ENDPOINT = "/api/submit";
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8000;

interface QueueEntry {
  payload: SubmitPayload;
  attempts: number;
}

// One pending Submission per Participant (keyed by id): a retake replaces the
// queued payload rather than piling up, mirroring the server's idempotency.
const queue = new Map<string, QueueEntry>();
let draining = false;

/**
 * Best-effort submit: enqueue the Submission and kick the retry loop. Returns
 * immediately — the caller never awaits the network (fire-and-forget).
 */
export function submitResult(payload: SubmitPayload): void {
  queue.set(payload.participantId, { payload, attempts: 0 });
  void drain();
}

/** Exponential backoff (500ms, 1s, 2s, 4s, …) capped at MAX_DELAY_MS. */
function backoff(attempt: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

async function postSubmission(payload: SubmitPayload): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      // Survive a navigation away from the result screen (e.g. to the family mix).
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Drain the queue sequentially, retrying each Submission with backoff. */
async function drain(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    while (queue.size > 0) {
      const next = queue.entries().next();
      if (next.done) break;
      const [id, entry] = next.value;

      const ok = await postSubmission(entry.payload);

      // A retake may have replaced this entry mid-flight; leave the newer one
      // for the next iteration rather than acting on a stale payload.
      if (queue.get(id) !== entry) continue;

      if (ok) {
        queue.delete(id);
        continue;
      }

      entry.attempts += 1;
      if (entry.attempts >= MAX_ATTEMPTS) {
        // Give up: the Participant already saw their result on-device.
        queue.delete(id);
        continue;
      }
      await delay(backoff(entry.attempts));
    }
  } finally {
    draining = false;
  }
}
