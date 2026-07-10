import { put } from "@vercel/blob";

/**
 * POST /api/upload — store an optional selfie in public Vercel Blob (obscure random path) and return
 * its URL for the Submission's `selfieUrl` (ADR-0001, ADR-0005).
 *
 * Accepts either a JSON body `{ dataUrl }` (the downscaled data URL captured at
 * the profile step) or a raw image request body. Selfies are optional and must
 * never block a Submission: when the Blob store is unconfigured
 * (`BLOB_READ_WRITE_TOKEN` unset) or the upload fails, we degrade to
 * `{ url: null }`. Live event data, so it is never cached.
 */
export const dynamic = "force-dynamic";

/** Decode a `data:<mime>;base64,<data>` URL into raw bytes + its content type. */
function decodeDataUrl(
  dataUrl: string,
): { bytes: Buffer; contentType: string } | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const [, mediaType, base64, data] = match;
  const bytes = base64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data), "utf8");
  if (bytes.length === 0) return null;
  return { bytes, contentType: mediaType || "application/octet-stream" };
}

/** Read the selfie from either a JSON `{ dataUrl }` body or a raw image body. */
async function readImage(
  request: Request,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  try {
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      const body = (await request.json()) as { dataUrl?: unknown };
      return typeof body.dataUrl === "string" ? decodeDataUrl(body.dataUrl) : null;
    }
    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.length === 0) return null;
    return { bytes, contentType: type || "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  // Graceful degrade: with no Blob token the selfie simply isn't stored. The
  // Submission still goes through with `selfieUrl: null` (ADR-0005 — selfies
  // are optional and never block submission).
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ url: null });
  }

  const image = await readImage(request);
  if (!image) return Response.json({ url: null }, { status: 400 });

  try {
    const { url } = await put(`selfies/${crypto.randomUUID()}`, image.bytes, {
      access: "public",
      contentType: image.contentType,
    });
    return Response.json({ url });
  } catch {
    // Best-effort: a failed upload must not block the Submission (ADR-0005).
    return Response.json({ url: null });
  }
}
