import { getRepo } from "@/lib/repo";
import type { JoinResponse } from "@/components/family/types";

/**
 * Join a Family by Family Code (ADR-0002). Idempotent for an existing member;
 * enforces the size cap (returns `full`) and rejects an unknown code
 * (`not_found`). Returns the Family Name so the screen can confirm the join.
 * Codes are normalised (trim + upper-case) so a typed code matches the minted
 * one; the join-QR already carries the exact code.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as
    | { code?: unknown; participantId?: unknown }
    | null;
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const participantId =
    typeof body?.participantId === "string" ? body.participantId.trim() : "";

  if (!code || !participantId) {
    return Response.json(
      { ok: false, error: "bad_request" } satisfies JoinResponse,
      { status: 400 },
    );
  }

  const result = await getRepo().joinFamily(code, participantId);
  if (result.ok) {
    return Response.json(
      { ok: true, familyName: result.family.name } satisfies JoinResponse,
    );
  }

  const status = result.error === "not_found" ? 404 : 409;
  return Response.json(
    { ok: false, error: result.error } satisfies JoinResponse,
    { status },
  );
}
