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
const UPLOAD_ENDPOINT = "/api/upload";
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8000;

interface QueueEntry {
  payload: SubmitPayload;
  attempts: number;
  /** Pending selfie data URL to upload before the first post; null once done. */
  selfie: string | null;
}

// One pending Submission per Participant (keyed by id): a retake replaces the
// queued payload rather than piling up, mirroring the server's idempotency.
const queue = new Map<string, QueueEntry>();
let draining = false;

/**
 * Best-effort submit: enqueue the Submission (with an optional selfie data URL
 * to upload first) and kick the retry loop. Returns immediately — the caller
 * never awaits the network (fire-and-forget).
 */
export function submitResult(
  payload: SubmitPayload,
  selfie?: string | null,
): void {
  queue.set(payload.participantId, { payload, attempts: 0, selfie: selfie ?? null });
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

/**
 * Best-effort selfie upload → the stored private-Blob URL, or null when the
 * store is unconfigured or the upload fails. Never throws: selfies are optional
 * and must not block the Submission (ADR-0005).
 */
async function uploadSelfie(dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: unknown };
    return typeof data.url === "string" ? data.url : null;
  } catch {
    return null;
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

      // Resolve the optional selfie once, best-effort, before the first post: a
      // failed or unconfigured upload degrades to `selfieUrl: null` and never
      // blocks the Submission (ADR-0005). Cleared afterwards so a retry does
      // not re-upload and orphan a duplicate Blob.
      if (entry.selfie !== null) {
        entry.payload.selfieUrl = await uploadSelfie(entry.selfie);
        entry.selfie = null;
      }

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
