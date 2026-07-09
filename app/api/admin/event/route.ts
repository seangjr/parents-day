import { setMode, setRunning } from "../store";

/**
 * POST /api/admin/event { running } — start / stop the experience (SPEC story
 * 26). Persists the operator's event on/off flag and drives the LED to match:
 * starting resumes live reveals, stopping pauses the wall (ADR-0004 modes), so
 * the LED only runs during the event. Gated by proxy.ts. Never cached.
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

  const { running } = body as Record<string, unknown>;
  if (typeof running !== "boolean") {
    return Response.json({ error: "invalid_running" }, { status: 400 });
  }

  await Promise.all([setRunning(running), setMode(running ? "live" : "paused")]);
  return Response.json({ ok: true, running });
}
