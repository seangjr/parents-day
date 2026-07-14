import type {
  Aggregates,
  Family,
  JoinFamilyResult,
  Submission,
  SubmissionLogPage,
} from "./types";

/**
 * The data-layer seam over Redis (ADR-0001): Submissions, Families, live
 * aggregates, and the append-only LED log. Implemented in-memory (tests / dev)
 * and against Upstash Redis (production). All methods are async so the two
 * implementations share one contract.
 */
export interface Repository {
  /**
   * Record a Submission, idempotent by participantId: a retake overwrites the
   * prior Submission and adjusts aggregate counters so the community counts
   * never double-count a Participant. Only a first-time Submission is appended
   * to the LED log (retakes don't re-enqueue — ADR-0004).
   */
  recordSubmission(submission: Submission): Promise<void>;

  /** Mint a unique, confusion-safe Family Code and create the Family. */
  createFamily(name: string): Promise<{ code: string }>;

  /**
   * Add a Participant to a Family by code. Idempotent for an existing member;
   * rejects an unknown code or a Family already at the size cap.
   */
  joinFamily(code: string, participantId: string): Promise<JoinFamilyResult>;

  /** Look up a Family by its code, or null if none exists. */
  familyByCode(code: string): Promise<Family | null>;

  /**
   * List every Family in creation order, including Families whose members have
   * not completed a Quiz yet. Backed by an explicit Redis index — never SCAN.
   */
  allFamilies(): Promise<Family[]>;

  /**
   * Submissions for the current members of a Family (members without a
   * Submission are omitted). Empty for an unknown code.
   */
  submissionsForFamily(code: string): Promise<Submission[]>;

  /** Live Community aggregates across the five Love Styles. */
  aggregates(): Promise<Aggregates>;

  /**
   * Read the append-only submission log from `cursor` onward (default 0),
   * returning new entries plus the next cursor for the LED to poll with.
   */
  submissionLog(cursor?: number): Promise<SubmissionLogPage>;

  /** Purge all event data (aggregates, families, submissions, log). */
  reset(): Promise<void>;
}
