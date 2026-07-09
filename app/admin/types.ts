import type { AdminMode } from "@/lib/led-orchestrator";
import type { Aggregates, Role } from "@/lib/repo";
import type { LoveStyleId } from "@/lib/love-styles";

/**
 * The console's view model (S08). Shared by the admin route handlers (server)
 * and the console client — kept type-only so importing it never pulls server
 * code (Redis, the repo) into the client bundle.
 */

export type { AdminMode };

/** One member of a Family as the console lists it. */
export interface AdminMemberView {
  participantId: string;
  firstName: string;
  role: Role;
  primary: LoveStyleId;
  /** Hidden by the operator (ADR-0005 remove-item safety valve). */
  removed: boolean;
}

/** A Family on the console with live counts. */
export interface AdminFamilyView {
  code: string;
  name: string;
  /** Participants linked to the Family (join order). */
  memberCount: number;
  /** Linked members with a Submission, after moderation. */
  submittedCount: number;
  members: AdminMemberView[];
}

/** A Submission as the console lists it (participantId kept for remove/restore). */
export interface AdminSubmissionView {
  participantId: string;
  firstName: string;
  role: Role;
  primary: LoveStyleId;
  familyCode: string | null;
  hasSelfie: boolean;
  /** Submission timestamp (epoch ms). */
  ts: number;
  removed: boolean;
}

/** `GET /api/admin/state` — the whole console view in one poll. */
export interface AdminStateResponse {
  /** Operator event on/off flag (start/stop). */
  running: boolean;
  /** Coarse LED mode the orchestrator obeys (ADR-0004). */
  mode: AdminMode;
  /** Community counts AFTER moderation (removed Submissions excluded). */
  totals: Aggregates;
  /** How many Submissions the operator has hidden. */
  removedCount: number;
  families: AdminFamilyView[];
  /** Newest-first; removed entries are kept (flagged) so they can be restored. */
  submissions: AdminSubmissionView[];
}
