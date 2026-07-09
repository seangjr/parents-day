import type { LoveStyleId } from "@/lib/love-styles";
import type { FamilyMixResult, Role } from "@/lib/scoring";

/**
 * The Family API contract (S05), shared by the route handlers and the family
 * screens. Type-only — no runtime, safe to import from either side of the
 * server/client boundary.
 */

/** A revealed Family member — one who has submitted, reduced to display + mix fields. */
export interface FamilyMemberView {
  firstName: string;
  role: Role;
  /** Resolved Primary Love Style — the only style that feeds the mix. */
  primary: LoveStyleId;
}

/** `GET /api/family/[code]` success payload. */
export interface FamilyView {
  code: string;
  name: string;
  /** Joined members — may exceed `members` when some haven't submitted yet. */
  memberCount: number;
  /** Members who have submitted, in join order; these feed the mix. */
  members: FamilyMemberView[];
  /** `familyMix(members)` once ≥ 2 members have revealed, else null. */
  mix: FamilyMixResult | null;
}

/** `POST /api/family/create` success payload. */
export interface CreateResponse {
  /** The server-minted, confusion-safe Family Code. */
  code: string;
}

/** `POST /api/family/join` response — success carries the name for the confirm copy. */
export type JoinResponse =
  | { ok: true; familyName: string }
  | { ok: false; error: "not_found" | "full" | "bad_request" };
