import { getRepo } from "@/lib/repo";
import { familiesIncludingLegacy } from "@/lib/repo/family-list";
import { LOVE_STYLE_ORDER, type LoveStyleId } from "@/lib/love-styles";
import type {
  AdminFamilyView,
  AdminStateResponse,
  AdminSubmissionView,
} from "@/app/admin/types";
import { readAdminState } from "../store";

/**
 * GET /api/admin/state — the whole console view (ADR-0006, gated by proxy.ts):
 * the coarse admin state (running flag + LED mode + hidden set) plus a live
 * snapshot of every Submission and Family with post-moderation community counts.
 * Pure read, never cached; the console polls it.
 *
 * Family/submission enumeration mirrors the LED read path (`/api/led-state`):
 * the explicit Family index exposes newly joined Families immediately, while the
 * append-only Submission log preserves pre-index event data.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const repo = getRepo();
  const [{ mode, running, removed }, aggregates, log, indexedFamilies] =
    await Promise.all([
      readAdminState(),
      repo.aggregates(),
      repo.submissionLog(0),
      repo.allFamilies(),
    ]);

  const entries = log.entries;

  const allFamilies = await familiesIncludingLegacy(repo, indexedFamilies, entries);
  const families: AdminFamilyView[] = await Promise.all(
    allFamilies.map(async (family) => {
      const members = await repo.submissionsForFamily(family.code);
      const memberViews = members.map((m) => ({
        participantId: m.participantId,
        firstName: m.firstName,
        role: m.role,
        primary: m.primary,
        removed: removed.has(m.participantId),
      }));
      return {
        code: family.code,
        name: family.name,
        memberCount: family.memberIds.length,
        submittedCount: memberViews.filter((m) => !m.removed).length,
        members: memberViews,
      };
    }),
  );

  // Post-moderation community counts. Subtract each removed participant's primary
  // from the live aggregates. Prefer their CURRENT primary (from family records,
  // so a retake is reflected); fall back to the log entry's primary for solo
  // participants the repo can't re-read by id.
  const currentPrimary = new Map<string, LoveStyleId>();
  for (const family of families) {
    for (const member of family.members) {
      currentPrimary.set(member.participantId, member.primary);
    }
  }
  const logPrimary = new Map<string, LoveStyleId>();
  for (const entry of entries) {
    if (!logPrimary.has(entry.participantId)) {
      logPrimary.set(entry.participantId, entry.primary);
    }
  }

  const counts = { ...aggregates.counts };
  for (const participantId of removed) {
    const primary =
      currentPrimary.get(participantId) ?? logPrimary.get(participantId);
    if (primary) counts[primary] = Math.max(0, counts[primary] - 1);
  }
  const total = LOVE_STYLE_ORDER.reduce((sum, id) => sum + counts[id], 0);

  const submissions: AdminSubmissionView[] = entries
    .map(
      (entry): AdminSubmissionView => ({
        participantId: entry.participantId,
        firstName: entry.firstName,
        role: entry.role,
        primary: entry.primary,
        familyCode: entry.familyCode,
        hasSelfie: entry.selfieUrl != null,
        ts: entry.ts,
        removed: removed.has(entry.participantId),
      }),
    )
    .sort((a, b) => b.ts - a.ts);

  const body: AdminStateResponse = {
    running,
    mode,
    totals: { counts, total },
    removedCount: removed.size,
    families,
    submissions,
  };
  return Response.json(body);
}
