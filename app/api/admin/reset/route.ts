import { getRepo } from "@/lib/repo";
import { resetAdminState } from "../store";

/**
 * POST /api/admin/reset { confirm: true } — purge ALL event data (ADR-0005): the
 * repository (submissions, families, aggregates, log) plus the admin-owned
 * coarse state (mode, running flag, removed set), so nothing persists after the
 * event. Requires an explicit `confirm` so a stray request can't wipe the room.
 * Gated by proxy.ts. Never cached.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "confirm_required" }, { status: 400 });
  }

  const { confirm } = body as Record<string, unknown>;
  if (confirm !== true) {
    return Response.json({ error: "confirm_required" }, { status: 400 });
  }

  await Promise.all([getRepo().reset(), resetAdminState()]);
  return Response.json({ ok: true });
}
