import { getRepo } from "@/lib/repo";
import { LOVE_STYLE_ORDER, type LoveStyleId } from "@/lib/love-styles";

/**
 * GET /api/community — live Community aggregates the LED polls (ADR-0004).
 *
 * Returns the five Love Style counts in canonical order plus the running total.
 * Percentages are community-scale only (ADR-0003) and are whole numbers that sum
 * to exactly 100 when there is at least one Submission. Live event data, so it
 * is never served from a build-time cache.
 */
export const dynamic = "force-dynamic";

/**
 * Whole-number percentages via the largest-remainder method so the five shares
 * sum to exactly 100 (avoids the off-by-one that naive per-style rounding shows
 * on the dashboard). All zero when there are no Submissions.
 */
function percentages(
  counts: Record<LoveStyleId, number>,
  total: number,
): Record<LoveStyleId, number> {
  const pct = {} as Record<LoveStyleId, number>;
  if (total === 0) {
    for (const id of LOVE_STYLE_ORDER) pct[id] = 0;
    return pct;
  }

  const parts = LOVE_STYLE_ORDER.map((id) => {
    const exact = (counts[id] / total) * 100;
    const floor = Math.floor(exact);
    pct[id] = floor;
    return { id, remainder: exact - floor };
  });

  // Hand the leftover points to the largest remainders; ties keep canonical
  // order (Array.prototype.sort is stable).
  let leftover = 100 - parts.reduce((sum, part) => sum + pct[part.id], 0);
  const byRemainder = [...parts].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < byRemainder.length && leftover > 0; i++, leftover--) {
    pct[byRemainder[i].id] += 1;
  }

  return pct;
}

export async function GET(): Promise<Response> {
  const { counts, total } = await getRepo().aggregates();
  const pct = percentages(counts, total);
  const styles = LOVE_STYLE_ORDER.map((id) => ({
    id,
    count: counts[id],
    pct: pct[id],
  }));

  return Response.json({ total, styles });
}
