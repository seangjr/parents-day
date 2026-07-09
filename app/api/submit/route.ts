import { getRepo } from "@/lib/repo";
import type { Role, Submission } from "@/lib/repo";
import { LOVE_STYLES, type LoveStyleId } from "@/lib/love-styles";

/**
 * POST /api/submit — record a Participant's completed Quiz.
 *
 * The write path for the client-first submit (ADR-0001): the personal result is
 * already shown on-device, so this endpoint exists only to feed the LED reveal +
 * community aggregates. Idempotent by participantId — a retake overwrites the
 * prior Submission (the repository keeps counters honest and does not re-enqueue
 * the LED log). Live event data, so it is never cached.
 */
export const dynamic = "force-dynamic";

/** Static membership table for the logic-bearing Role enum (ADR-0002). */
const ROLES: Record<Role, true> = {
  parent: true,
  child: true,
  grandparent: true,
  guardian: true,
  other: true,
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

/**
 * Validate a raw JSON body into a server-stamped Submission, or null when the
 * shape is invalid. `familyCode`/`selfieUrl` are optional and normalise to null;
 * `ts` is stamped here (clients never supply it). Role and primary are checked
 * against their canonical tables (LOVE_STYLES is the single source of styles).
 */
function parseSubmission(body: unknown): Submission | null {
  if (typeof body !== "object" || body === null) return null;
  const { participantId, firstName, role, primary, familyCode, selfieUrl } =
    body as Record<string, unknown>;

  if (!isNonEmptyString(participantId)) return null;
  if (!isNonEmptyString(firstName)) return null;
  if (typeof role !== "string" || !Object.hasOwn(ROLES, role)) return null;
  if (typeof primary !== "string" || !Object.hasOwn(LOVE_STYLES, primary)) {
    return null;
  }
  if (!isNullableString(familyCode)) return null;
  if (!isNullableString(selfieUrl)) return null;

  return {
    participantId,
    firstName,
    role: role as Role,
    primary: primary as LoveStyleId,
    familyCode: familyCode ?? null,
    selfieUrl: selfieUrl ?? null,
    ts: Date.now(),
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const submission = parseSubmission(body);
  if (!submission) {
    return Response.json(
      { ok: false, error: "invalid_submission" },
      { status: 400 },
    );
  }

  await getRepo().recordSubmission(submission);
  return Response.json({ ok: true });
}
