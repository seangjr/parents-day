import type { Redis } from "@upstash/redis";
import { redisFromEnv } from "@/lib/redis";
import { LOVE_STYLE_ORDER } from "@/lib/love-styles";
import { MAX_FAMILY_SIZE, mintFamilyCode, zeroCounts } from "./internal";
import type { Repository } from "./repository";
import type {
  Aggregates,
  Family,
  JoinFamilyResult,
  Submission,
  SubmissionLogPage,
} from "./types";

const AGG_PREFIX = "agg:";
const FAMILY_PREFIX = "family:";
const SUB_PREFIX = "sub:";
const LOG_KEY = "log";

/** Shape of a Family stored as a Redis hash (Upstash serializes each field). */
type FamilyHash = {
  code: string;
  name: string;
  memberIds: string[];
  createdTs: number;
};

/**
 * Upstash Redis Repository (ADR-0001) — the production source of truth.
 * Keys: `agg:<style>` counters, `family:<code>` hash, `sub:<id>` record,
 * and the `log` list. The client is constructed lazily so importing this
 * module never requires the env to be present.
 */
export class UpstashRepository implements Repository {
  private client: Redis | null = null;

  private redis(): Redis {
    if (!this.client) {
      const client = redisFromEnv();
      if (!client) {
        throw new Error(
          "UpstashRepository requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
        );
      }
      this.client = client;
    }
    return this.client;
  }

  async recordSubmission(submission: Submission): Promise<void> {
    const redis = this.redis();
    const key = `${SUB_PREFIX}${submission.participantId}`;
    const prior = await redis.get<Submission>(key);

    const pipeline = redis.pipeline();
    if (prior) pipeline.decr(`${AGG_PREFIX}${prior.primary}`);
    pipeline.set(key, submission);
    pipeline.incr(`${AGG_PREFIX}${submission.primary}`);
    // Retakes don't re-enqueue (ADR-0004): only a first Submission reveals.
    if (!prior) pipeline.rpush(LOG_KEY, submission);
    await pipeline.exec();
  }

  async createFamily(name: string): Promise<{ code: string }> {
    const redis = this.redis();
    let code = mintFamilyCode(name);
    while (await redis.exists(`${FAMILY_PREFIX}${code}`)) {
      code = mintFamilyCode(name);
    }
    await redis.hset(`${FAMILY_PREFIX}${code}`, {
      code,
      name,
      memberIds: [] as string[],
      createdTs: Date.now(),
    });
    return { code };
  }

  async joinFamily(
    code: string,
    participantId: string,
  ): Promise<JoinFamilyResult> {
    const family = await this.familyByCode(code);
    if (!family) return { ok: false, error: "not_found" };
    if (family.memberIds.includes(participantId)) {
      return { ok: true, family };
    }
    if (family.memberIds.length >= MAX_FAMILY_SIZE) {
      return { ok: false, error: "full" };
    }
    const memberIds = [...family.memberIds, participantId];
    await this.redis().hset(`${FAMILY_PREFIX}${code}`, { memberIds });
    return { ok: true, family: { ...family, memberIds } };
  }

  async familyByCode(code: string): Promise<Family | null> {
    const raw = await this.redis().hgetall<FamilyHash>(
      `${FAMILY_PREFIX}${code}`,
    );
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      code,
      name: raw.name,
      memberIds: raw.memberIds ?? [],
      createdTs: Number(raw.createdTs),
    };
  }

  async submissionsForFamily(code: string): Promise<Submission[]> {
    const family = await this.familyByCode(code);
    if (!family || family.memberIds.length === 0) return [];
    const keys = family.memberIds.map((id) => `${SUB_PREFIX}${id}`);
    const found = await this.redis().mget<(Submission | null)[]>(...keys);
    return found.filter((entry): entry is Submission => entry != null);
  }

  async aggregates(): Promise<Aggregates> {
    const keys = LOVE_STYLE_ORDER.map((id) => `${AGG_PREFIX}${id}`);
    const values = await this.redis().mget<(number | null)[]>(...keys);
    const counts = zeroCounts();
    LOVE_STYLE_ORDER.forEach((id, index) => {
      counts[id] = Number(values[index] ?? 0);
    });
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { counts, total };
  }

  async submissionLog(cursor = 0): Promise<SubmissionLogPage> {
    const start = Math.max(0, cursor);
    const entries = await this.redis().lrange<Submission>(LOG_KEY, start, -1);
    return { entries, cursor: start + entries.length };
  }

  async reset(): Promise<void> {
    await this.redis().flushdb();
  }
}
