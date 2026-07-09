import { setRemoved } from "../store";

/**
 * POST /api/admin/remove { participantId, removed } — the remove-item safety
 * valve (ADR-0005 / SPEC story 30). Hides (`removed: true`, the default) or
 * restores (`removed: false`) a Submission by participantId. Hidden Submissions
 * are filtered from the console's views and dropped from its community counts.
 * Gated by proxy.ts. Never cached.
 *
 * Note: this suppresses items in the operator's console. The LED read path
 * (`/api/led-state`, owned by S07) does not yet consult the hidden set — wiring
 * that filter into the LED is the S09 integration step.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const { participantId, removed } = body as Record<string, unknown>;
  if (typeof participantId !== "string" || participantId.trim().length === 0) {
    return Response.json({ error: "invalid_participant" }, { status: 400 });
  }

  // Default action is to hide; only an explicit `false` restores.
  const hide = removed === undefined ? true : removed !== false;
  await setRemoved(participantId, hide);
  return Response.json({ ok: true, participantId, removed: hide });
}
