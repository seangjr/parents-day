import type { LoveStyleId } from "@/lib/love-styles";
import { MAX_FAMILY_SIZE, mintFamilyCode, zeroCounts } from "./internal";
import type { Repository } from "./repository";
import type {
  Aggregates,
  Family,
  JoinFamilyResult,
  Submission,
  SubmissionLogPage,
} from "./types";

/**
 * In-memory Repository — the source of truth for tests and the dev fallback
 * when Upstash env is absent. State lives for the process lifetime only.
 */
export class MemoryRepository implements Repository {
  private readonly submissions = new Map<string, Submission>();
  private readonly families = new Map<string, Family>();
  private readonly counts: Record<LoveStyleId, number> = zeroCounts();
  private readonly log: Submission[] = [];

  async recordSubmission(submission: Submission): Promise<void> {
    const prior = this.submissions.get(submission.participantId);
    if (prior) this.counts[prior.primary] -= 1;
    this.submissions.set(submission.participantId, { ...submission });
    this.counts[submission.primary] += 1;
    // Retakes don't re-enqueue (ADR-0004): only a first Submission reveals.
    if (!prior) this.log.push({ ...submission });
  }

  async createFamily(name: string): Promise<{ code: string }> {
    let code = mintFamilyCode(name);
    while (this.families.has(code)) code = mintFamilyCode(name);
    this.families.set(code, { code, name, memberIds: [], createdTs: Date.now() });
    return { code };
  }

  async joinFamily(
    code: string,
    participantId: string,
  ): Promise<JoinFamilyResult> {
    const family = this.families.get(code);
    if (!family) return { ok: false, error: "not_found" };
    if (!family.memberIds.includes(participantId)) {
      if (family.memberIds.length >= MAX_FAMILY_SIZE) {
        return { ok: false, error: "full" };
      }
      family.memberIds.push(participantId);
    }
    return { ok: true, family: { ...family, memberIds: [...family.memberIds] } };
  }

  async familyByCode(code: string): Promise<Family | null> {
    const family = this.families.get(code);
    if (!family) return null;
    return { ...family, memberIds: [...family.memberIds] };
  }

  async allFamilies(): Promise<Family[]> {
    return Array.from(this.families.values(), (family) => ({
      ...family,
      memberIds: [...family.memberIds],
    }));
  }

  async submissionsForFamily(code: string): Promise<Submission[]> {
    const family = this.families.get(code);
    if (!family) return [];
    const submissions: Submission[] = [];
    for (const id of family.memberIds) {
      const submission = this.submissions.get(id);
      if (submission) submissions.push({ ...submission });
    }
    return submissions;
  }

  async aggregates(): Promise<Aggregates> {
    const counts = { ...this.counts };
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { counts, total };
  }

  async submissionLog(cursor = 0): Promise<SubmissionLogPage> {
    const start = Math.max(0, Math.min(cursor, this.log.length));
    const entries = this.log.slice(start).map((entry) => ({ ...entry }));
    return { entries, cursor: start + entries.length };
  }

  async reset(): Promise<void> {
    this.submissions.clear();
    this.families.clear();
    this.log.length = 0;
    for (const id of Object.keys(this.counts) as LoveStyleId[]) {
      this.counts[id] = 0;
    }
  }
}
