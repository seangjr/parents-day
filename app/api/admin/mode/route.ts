import { isAdminMode, setMode } from "../store";

/**
 * POST /api/admin/mode { mode } — set the coarse LED mode (ADR-0004): welcome /
 * live / photo-moment / love-mix / paused. This is the operator's LED lever:
 * `photo-moment` triggers a Photo Moment (the LED spotlights the largest family),
 * `love-mix` holds the "Today's Love Mix" community dashboard, `live` forces the
 * reveal cadence to resume, `welcome` / `paused` hold the wall on idle.
 * Gated by proxy.ts (ADR-0006). Live control, never cached.
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

  const { mode } = body as Record<string, unknown>;
  if (!isAdminMode(mode)) {
    return Response.json({ error: "invalid_mode" }, { status: 400 });
  }

  await setMode(mode);
  return Response.json({ ok: true, mode });
}
