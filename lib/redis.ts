import { Redis } from "@upstash/redis";

/**
 * Construct an Upstash Redis client from env, or null when unconfigured.
 * The single place the client is built — shared by the admin store and the
 * repository so env handling never drifts between them.
 */
export function redisFromEnv(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}
