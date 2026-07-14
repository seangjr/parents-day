import type { Repository } from "./repository";
import type { Family, Submission } from "./types";

/**
 * Merge the explicit Family index with codes recoverable from the historical
 * Submission log. The log fallback keeps pre-index event data visible during
 * the clean cutover; new Families always come from `Repository.allFamilies()`.
 */
export async function familiesIncludingLegacy(
  repo: Repository,
  indexedFamilies: Family[],
  logEntries: Submission[],
): Promise<Family[]> {
  const byCode = new Map(indexedFamilies.map((family) => [family.code, family]));
  const missingCodes = new Set<string>();

  for (const entry of logEntries) {
    const code = entry.familyCode;
    if (!code || byCode.has(code) || missingCodes.has(code)) continue;
    missingCodes.add(code);
  }

  const legacyFamilies = await Promise.all(
    Array.from(missingCodes, (code) => repo.familyByCode(code)),
  );
  for (const family of legacyFamilies) {
    if (family) byCode.set(family.code, family);
  }

  return Array.from(byCode.values()).sort(
    (a, b) => a.createdTs - b.createdTs || a.code.localeCompare(b.code),
  );
}
