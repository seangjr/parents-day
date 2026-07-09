import { getRepo } from "@/lib/repo";
import type { CreateResponse } from "@/components/family/types";

/**
 * Create a Family (ADR-0002): the caller supplies a display name, the server
 * mints a unique confusion-safe Family Code. The creator joins separately via
 * `POST /api/family/join` so membership stays a single, idempotent path.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { code } = await getRepo().createFamily(name);
  return Response.json({ code } satisfies CreateResponse);
}
