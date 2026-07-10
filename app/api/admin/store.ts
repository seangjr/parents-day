import type { Redis } from "@upstash/redis";
import { redisFromEnv } from "@/lib/redis";
import type { AdminMode } from "@/lib/led-orchestrator";

/**
 * Admin-owned coarse state (ADR-0004 / ADR-0006). Three keys the console and
 * the LED read path share via Redis in production:
 *
 *  - `led:mode`      the coarse LED mode the orchestrator obeys — MUST match the
 *                    key `app/api/led-state` reads (that route owns the LED read
 *                    path; this one owns the write).
 *  - `admin:running` the operator's event on/off flag (start/stop).
 *  - `admin:removed` a set of hidden participantIds (ADR-0005 remove-item safety
 *                    valve), filtered from the console's views.
 *
 * When Upstash is not configured (dev / in-memory repo, per `getRepo`) the state
 * lives in a process-local fallback so the console is fully usable locally
 * without Redis — the same dev posture the repo and `led-state` already take.
 */

/** MUST match `MODE_KEY` in app/api/led-state/route.ts. */
const MODE_KEY = "led:mode";
const RUNNING_KEY = "admin:running";
const REMOVED_KEY = "admin:removed";

/** The four coarse modes an operator can set (ADR-0004). */
export const ADMIN_MODES = ["welcome", "live", "photo-moment", "paused"] as const;

/** Default when unset — "live" so the LED never waits on a flag (matches led-state). */
const DEFAULT_MODE: AdminMode = "live";

export function isAdminMode(value: unknown): value is AdminMode {
  return (
    typeof value === "string" &&
    (ADMIN_MODES as readonly string[]).includes(value)
  );
}

function redis(): Redis | null {
  return redisFromEnv();
}

/** Process-local fallback (dev only; single process, mirrors MemoryRepository). */
const local: { mode: AdminMode; running: boolean; removed: Set<string> } = {
  mode: DEFAULT_MODE,
  running: true,
  removed: new Set<string>(),
};

export interface AdminCoarseState {
  mode: AdminMode;
  running: boolean;
  removed: Set<string>;
}

/** Read the coarse admin state (mode + running flag + removed set). */
export async function readAdminState(): Promise<AdminCoarseState> {
  const client = redis();
  if (!client) {
    return {
      mode: local.mode,
      running: local.running,
      removed: new Set(local.removed),
    };
  }
  const [rawMode, rawRunning, removedList] = await Promise.all([
    client.get<string>(MODE_KEY),
    client.get<string>(RUNNING_KEY),
    client.smembers(REMOVED_KEY),
  ]);
  return {
    mode: isAdminMode(rawMode) ? rawMode : DEFAULT_MODE,
    // Absent ⇒ running (consistent with the "live" mode default).
    running: rawRunning == null ? true : rawRunning === "1",
    removed: new Set(Array.isArray(removedList) ? removedList.map(String) : []),
  };
}

/** Set the coarse LED mode (welcome / live / photo-moment / paused). */
export async function setMode(mode: AdminMode): Promise<void> {
  const client = redis();
  if (!client) {
    local.mode = mode;
    return;
  }
  await client.set(MODE_KEY, mode);
}

/** Set the operator's event on/off flag. */
export async function setRunning(running: boolean): Promise<void> {
  const client = redis();
  if (!client) {
    local.running = running;
    return;
  }
  await client.set(RUNNING_KEY, running ? "1" : "0");
}

/** Hide (`removed=true`) or restore a Submission by participantId. */
export async function setRemoved(
  participantId: string,
  removed: boolean,
): Promise<void> {
  const client = redis();
  if (!client) {
    if (removed) local.removed.add(participantId);
    else local.removed.delete(participantId);
    return;
  }
  if (removed) await client.sadd(REMOVED_KEY, participantId);
  else await client.srem(REMOVED_KEY, participantId);
}

/**
 * Purge admin-owned coarse state — called alongside `repo.reset()` so a reset
 * leaves nothing behind (ADR-0005): mode/running revert to defaults, the removed
 * set clears.
 */
export async function resetAdminState(): Promise<void> {
  const client = redis();
  if (!client) {
    local.mode = DEFAULT_MODE;
    local.running = true;
    local.removed.clear();
    return;
  }
  await Promise.all([
    client.del(MODE_KEY),
    client.del(RUNNING_KEY),
    client.del(REMOVED_KEY),
  ]);
}
