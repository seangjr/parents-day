import type { LoveStyleId, Role } from "@/lib/love-styles";

/** Re-exported for repo consumers; canonical definition lives in @/lib/love-styles. */
export type { Role };

/**
 * An anonymous Participant — one per device, identified by a client-generated
 * id (ADR-0002). Known only for the duration of the event.
 */
export interface Participant {
  /** Client-generated id; stable per device. */
  id: string;
  firstName: string;
  role: Role;
  /** The Family this Participant has joined, or null. */
  familyCode: string | null;
}

/**
 * A completed Quiz posted to the server — the unit the LED reveals and the
 * aggregates count. Keyed by participantId; a retake overwrites the prior one.
 */
export interface Submission {
  participantId: string;
  firstName: string;
  role: Role;
  familyCode: string | null;
  /** Resolved Primary Love Style — the only style that feeds aggregates. */
  primary: LoveStyleId;
  /** Private Vercel Blob URL, or null when the selfie was skipped. */
  selfieUrl: string | null;
  /** Submission timestamp (epoch ms). */
  ts: number;
}

/**
 * A Family, uniquely identified by its server-minted Family Code (ADR-0002).
 * The name is a non-unique display label; membership is capped (see
 * MAX_FAMILY_SIZE).
 */
export interface Family {
  code: string;
  name: string;
  /** Participant ids in join order. */
  memberIds: string[];
  createdTs: number;
}

/**
 * Live Community aggregates: a count per Love Style plus the running total of
 * counted Submissions (one per Participant).
 */
export interface Aggregates {
  counts: Record<LoveStyleId, number>;
  total: number;
}

/** A page of the append-only submission log, consumed by the LED via cursor. */
export interface SubmissionLogPage {
  /** Entries appended since the requested cursor, in order. */
  entries: Submission[];
  /** Cursor to pass on the next poll to receive only newer entries. */
  cursor: number;
}

/**
 * Result of a joinFamily attempt: confirm data (the Family, for the
 * "You're joining The Tan Family — yes?" step) or a typed error.
 */
export type JoinFamilyResult =
  | { ok: true; family: Family }
  | { ok: false; error: "not_found" | "full" };
