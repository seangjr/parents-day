import { Redis } from "@upstash/redis";
import { getRepo } from "@/lib/repo";
import type {
  AdminMode,
  LedFamily,
  LedStateResponse,
} from "@/lib/led-orchestrator";

/**
 * GET /api/led-state?cursor=N — the single read endpoint the `/led` client polls
 * every ~1–2s (ADR-0001 / ADR-0004).
 *
 * Returns the coarse state the LED orchestrator needs: the append-only log delta
 * since `cursor` (first-join reveals), live community aggregates, a snapshot of
 * every family on the wall, and the admin-set mode. The `/led` client owns all
 * fine-grained reveal timing; this endpoint is pure state, never cached.
 *
 * Family primaries come from `submissionsForFamily` (current records, so retakes
 * are reflected), while `newSubmissions` come from the log (first-join order) so
 * an idempotent retake never re-enqueues a reveal.
 */
export const dynamic = "force-dynamic";

/** Redis key holding the coarse admin mode (ADR-0004); absent ⇒ "live". */
const MODE_KEY = "led:mode";

const ADMIN_MODES: Record<AdminMode, true> = {
  welcome: true,
  live: true,
  "photo-moment": true,
  paused: true,
};

/**
 * Read the coarse admin mode from Redis, defaulting to "live". When Upstash is
 * not configured (dev / in-memory repo) or the read fails, the LED stays live so
 * it never blanks waiting on a flag.
 */
async function readMode(): Promise<AdminMode> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return "live";
  try {
    const raw = await new Redis({ url, token }).get<string>(MODE_KEY);
    return typeof raw === "string" && Object.hasOwn(ADMIN_MODES, raw)
      ? (raw as AdminMode)
      : "live";
  } catch {
    return "live";
  }
}

export async function GET(request: Request): Promise<Response> {
  const rawCursor = Number(new URL(request.url).searchParams.get("cursor"));
  const cursor = Number.isFinite(rawCursor) && rawCursor > 0 ? Math.floor(rawCursor) : 0;
  const repo = getRepo();

  const [aggregates, log, mode] = await Promise.all([
    repo.aggregates(),
    // The whole log: its head is the next cursor, and its family codes enumerate
    // the wall. The delta the client hasn't seen is everything past `cursor`.
    repo.submissionLog(0),
    readMode(),
  ]);

  const entries = log.entries;
  const head = log.cursor;
  const start = Math.min(Math.max(cursor, 0), entries.length);
  const newSubmissions = entries.slice(start);

  // Distinct family codes in first-seen order — the families on the wall.
  const codes: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (entry.familyCode && !seen.has(entry.familyCode)) {
      seen.add(entry.familyCode);
      codes.push(entry.familyCode);
    }
  }

  const families = (
    await Promise.all(
      codes.map(async (code): Promise<LedFamily | null> => {
        const [family, members] = await Promise.all([
          repo.familyByCode(code),
          repo.submissionsForFamily(code),
        ]);
        if (!family && members.length === 0) return null;
        return {
          code,
          name: family?.name ?? code,
          memberCount: family?.memberIds.length ?? members.length,
          members: members.map((m) => ({
            firstName: m.firstName,
            role: m.role,
            primary: m.primary,
          })),
        };
      }),
    )
  ).filter((f): f is LedFamily => f !== null);

  const body: LedStateResponse = {
    cursor: head,
    newSubmissions,
    aggregates,
    families,
    mode,
  };
  return Response.json(body);
}
