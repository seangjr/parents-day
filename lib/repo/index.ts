import { MemoryRepository } from "./memory";
import type { Repository } from "./repository";
import { UpstashRepository } from "./upstash";

export type { Repository } from "./repository";
export * from "./types";
export { MemoryRepository } from "./memory";
export { UpstashRepository } from "./upstash";

let cached: Repository | null = null;

/**
 * Return the shared Repository: Upstash when its env is configured, otherwise
 * the in-memory fallback (dev). Cached per process so the memory fallback keeps
 * a single source of truth across calls.
 */
export function getRepo(): Repository {
  if (cached) return cached;
  const hasUpstash = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
  cached = hasUpstash ? new UpstashRepository() : new MemoryRepository();
  return cached;
}
