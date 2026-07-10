import { getRepo } from "@/lib/repo";
import { LOVE_STYLE_ORDER, type LoveStyleId } from "@/lib/love-styles";
import type { AdminMode, LedFamily, LedStateResponse } from "@/lib/led-orchestrator";
import { readAdminState } from "@/app/api/admin/store";

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
 *
 * Moderated-out participants (ADR-0005 "remove") are filtered everywhere they
 * would surface — the reveal delta, family member lists, and the community
 * counts — so a removed name never reaches the wall (mirrors `/api/admin/state`).
 */
export const dynamic = "force-dynamic";

/**
 * The coarse admin state the LED read path needs: the mode plus the set of
 * moderated-out participantIds (ADR-0005). Reads the same store as the console's
 * `/api/admin/state`, so the wall and the console never disagree. Resilient by
 * design — a missing or failing Redis read falls back to "live" with nothing
 * hidden, so the wall never blanks (nor wrongly hides names) waiting on a flag.
 */
async function readAdminCoarse(): Promise<{ mode: AdminMode; removed: Set<string> }> {
  try {
    const { mode, removed } = await readAdminState();
    return { mode, removed };
  } catch {
    return { mode: "live", removed: new Set() };
  }
}

export async function GET(request: Request): Promise<Response> {
  const rawCursor = Number(new URL(request.url).searchParams.get("cursor"));
  const cursor = Number.isFinite(rawCursor) && rawCursor > 0 ? Math.floor(rawCursor) : 0;
  const repo = getRepo();

  const [aggregates, log, { mode, removed }] = await Promise.all([
    repo.aggregates(),
    // The whole log: its head is the next cursor, and its family codes enumerate
    // the wall. The delta the client hasn't seen is everything past `cursor`.
    repo.submissionLog(0),
    readAdminCoarse(),
  ]);

  const entries = log.entries;
  const head = log.cursor;
  const start = Math.min(Math.max(cursor, 0), entries.length);
  // Removed items are moderated off the wall (ADR-0005): drop them from the
  // first-join reveal delta so a hidden name never animates in.
  const newSubmissions = entries.slice(start).filter((e) => !removed.has(e.participantId));

  // Distinct family codes in first-seen order — the families on the wall.
  const codes: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (entry.familyCode && !seen.has(entry.familyCode)) {
      seen.add(entry.familyCode);
      codes.push(entry.familyCode);
    }
  }

  // Hydrate each family once; keep the raw submissions to compute post-moderation
  // counts, then project members to the LED shape with removed participants dropped.
  const hydrated = (
    await Promise.all(
      codes.map(async (code) => {
        const [family, members] = await Promise.all([
          repo.familyByCode(code),
          repo.submissionsForFamily(code),
        ]);
        if (!family && members.length === 0) return null;
        return { code, family, members };
      }),
    )
  ).filter((f): f is NonNullable<typeof f> => f !== null);

  const families: LedFamily[] = hydrated.map(({ code, family, members }) => ({
    code,
    name: family?.name ?? code,
    memberCount: family?.memberIds.length ?? members.length,
    members: members
      .filter((m) => !removed.has(m.participantId))
      .map((m) => ({ firstName: m.firstName, role: m.role, primary: m.primary })),
  }));

  // Post-moderation community counts — mirror `/api/admin/state`: subtract each
  // removed participant's primary from the live aggregates. Prefer their CURRENT
  // primary (from family records, so a retake is reflected); fall back to the log
  // entry's primary for solo participants the repo can't re-read by id.
  const currentPrimary = new Map<string, LoveStyleId>();
  for (const { members } of hydrated) {
    for (const m of members) currentPrimary.set(m.participantId, m.primary);
  }
  const logPrimary = new Map<string, LoveStyleId>();
  for (const entry of entries) {
    if (!logPrimary.has(entry.participantId)) {
      logPrimary.set(entry.participantId, entry.primary);
    }
  }
  const counts = { ...aggregates.counts };
  for (const participantId of removed) {
    const primary = currentPrimary.get(participantId) ?? logPrimary.get(participantId);
    if (primary) counts[primary] = Math.max(0, counts[primary] - 1);
  }
  const total = LOVE_STYLE_ORDER.reduce((sum, id) => sum + counts[id], 0);

  const body: LedStateResponse = {
    cursor: head,
    newSubmissions,
    aggregates: { counts, total },
    families,
    mode,
  };
  return Response.json(body);
}
