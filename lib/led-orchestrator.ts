/**
 * LED orchestrator — a pure, deterministic reducer (ADR-0004).
 *
 * Serverless + polling (ADR-0001) can't run a server-side scheduler, so the
 * `/led` client owns fine-grained reveal timing. This module is that timing
 * brain, factored out as a pure function of (state, event) → { state, directive }
 * so it can be unit-tested exhaustively without a wall clock or a browser.
 *
 * Redis holds the coarse admin **mode** (welcome / live / photo-moment / paused);
 * the reducer maps that plus the submission queue, live aggregates, and family
 * snapshots onto one **directive** — the LED screen to show right now, keyed to
 * the Figma LED layouts:
 *   welcome/idle → the join QR (LED 1 base)         active-join → LED 3
 *   cluster-wall → LED 1/2 ambient family wall      family-mix  → LED 4
 *   stats        → LED 5 community dashboard         photo-moment → PhotoMoment
 *   montage      → flood burst ("N people just joined")
 *
 * Every timing decision is driven by the `now` carried on each event; the module
 * never reads the clock itself. Nothing here mutates its input state.
 */

import {
  familyMix,
  type FamilyMixResult,
  type Role,
} from "@/lib/scoring";
import { LOVE_STYLE_ORDER, type LoveStyleId } from "@/lib/love-styles";
import type { Aggregates, Submission } from "@/lib/repo";

// ---------------------------------------------------------------------------
// Timing (ADR-0004 cadence / throttle / flood). Exported so tests pin the
// exact thresholds rather than re-deriving them.
// ---------------------------------------------------------------------------

export const LED_TIMING = {
  /** ~1 individual reveal per 4–6s. */
  revealInterval: 5000,
  /** How long an individual reveal holds the screen (fills the cadence slot). */
  revealHold: 5000,
  /** How long a family reveal holds the screen. */
  familyHold: 8000,
  /** Re-reveal throttle per family (≤ once / 3–5 min). */
  familyThrottle: 240_000,
  /** How long an admin Photo Moment holds. */
  photoHold: 10_000,
  /** How long a flood montage burst holds before favouring the dashboard. */
  montageHold: 6000,
  /** Cut to the dashboard after this many individual reveals (~6–8). */
  dashboardAfterReveals: 7,
  /** …or this long since the last dashboard (~60s). */
  dashboardMaxInterval: 60_000,
  /** How long the dashboard holds (~10–15s). */
  dashboardHold: 12_000,
  /** Drop to Idle/Welcome after this much quiet (~20–30s). */
  idleAfter: 25_000,
  /** Backlog above this switches to the montage burst (> ~15). */
  floodThreshold: 15,
  /** Faces sampled into the montage burst. */
  montageFaces: 6,
} as const;

// ---------------------------------------------------------------------------
// Public data shapes (shared by the API route, the reducer, and the /led page)
// ---------------------------------------------------------------------------

/** Coarse admin-set mode held in Redis (ADR-0004). */
export type AdminMode = "welcome" | "live" | "photo-moment" | "paused";

/** The LED screen a directive selects. */
export type LedMode =
  | "welcome"
  | "cluster-wall"
  | "active-join"
  | "family-mix"
  | "photo-moment"
  | "stats"
  | "montage";

/** A revealed family member reduced to what the LED renders + mixes. */
export interface LedFamilyMember {
  firstName: string;
  role: Role;
  primary: LoveStyleId;
}

/** A family snapshot for the wall — submitted members feed reveals + the mix. */
export interface LedFamily {
  code: string;
  name: string;
  /** Members who have joined (may exceed `members` before they submit). */
  memberCount: number;
  /** Members who have submitted, in join order. */
  members: LedFamilyMember[];
}

/** `GET /api/led-state` payload the client feeds the reducer each poll. */
export interface LedStateResponse {
  /** Cursor to pass on the next poll to receive only newer log entries. */
  cursor: number;
  /** First-join submissions appended since the requested cursor. */
  newSubmissions: Submission[];
  aggregates: Aggregates;
  families: LedFamily[];
  /** Coarse admin mode (default "live"). */
  mode: AdminMode;
}

/** One participant spotlighted in an individual reveal or montage face. */
export interface RevealView {
  participantId: string;
  firstName: string;
  role: Role;
  primary: LoveStyleId;
  selfieUrl: string | null;
  familyName: string | null;
}

/** A family spotlighted in a family reveal / photo moment. */
export interface FamilyView {
  code: string;
  name: string;
  members: LedFamilyMember[];
  /** `familyMix(members)` once ≥ 2 members have submitted, else null. */
  mix: FamilyMixResult | null;
}

/**
 * The directive: which LED screen to render now + its payload. Discriminated on
 * `mode`; `key` is a stable per-segment identity the page re-keys enter
 * animations on (same key across polls ⇒ update in place, no re-animate).
 */
export type LedDirective =
  | { mode: "welcome"; key: string; payload: Record<string, never> }
  | { mode: "cluster-wall"; key: string; payload: { families: LedFamily[]; total: number } }
  | { mode: "active-join"; key: string; payload: { reveal: RevealView; families: LedFamily[] } }
  | { mode: "family-mix"; key: string; payload: { family: FamilyView; families: LedFamily[] } }
  | { mode: "photo-moment"; key: string; payload: { family: FamilyView } }
  | {
      mode: "stats";
      key: string;
      payload: { counts: Record<LoveStyleId, number>; total: number; familyCount: number };
    }
  | { mode: "montage"; key: string; payload: { count: number; faces: RevealView[]; total: number } };

/** Event driving the reducer: a fresh poll payload, or a timing-only tick. */
export type LedEvent =
  | { type: "poll"; now: number; data: LedStateResponse }
  | { type: "tick"; now: number };

// ---------------------------------------------------------------------------
// Internal reducer state
// ---------------------------------------------------------------------------

/** The currently-displayed segment (mode + optional family target + start time). */
interface Segment {
  mode: LedMode;
  target: string | null;
  since: number;
}

/**
 * Fine-grained timing state threaded across ticks/polls by the client (held in
 * a ref, never serialized). Treated as immutable — the reducer returns a fresh
 * state and never mutates the input.
 */
export interface OrchestratorState {
  adminMode: AdminMode;
  aggregates: Aggregates;
  families: LedFamily[];
  familyByCode: Record<string, LedFamily>;
  /** Pending individual reveals (first-join submissions not yet shown). */
  queue: Submission[];
  /** Participant ids already revealed or consumed by a montage (dedupe). */
  revealedIds: Set<string>;
  /** Last noticed submitted-member count per family (growth detection). */
  familySeen: Record<string, number>;
  /** Last reveal time per family (re-reveal throttle). */
  familyRevealedAt: Record<string, number>;
  /** Family codes pending a reveal, FIFO; coalesces repeat growth. */
  familyRevealQueue: string[];
  current: Segment;
  currentReveal: Submission | null;
  montage: { count: number; faces: RevealView[] } | null;
  lastRevealAt: number;
  revealsSinceDashboard: number;
  lastDashboardAt: number;
  lastActivityAt: number;
}

interface Desired {
  mode: LedMode;
  target: string | null;
}

/**
 * The selection outcome: keep holding the current segment, or start a fresh one.
 * Distinguishing "hold" from "start" is what lets consecutive individual reveals
 * (both `active-join`/`null`) advance the queue instead of looking identical.
 */
type Choice = { kind: "hold" } | { kind: "start"; mode: LedMode; target: string | null };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zeroCounts(): Record<LoveStyleId, number> {
  const counts = {} as Record<LoveStyleId, number>;
  for (const id of LOVE_STYLE_ORDER) counts[id] = 0;
  return counts;
}

/** A fresh orchestrator state; boots on the Welcome/idle screen. */
export function initialLedState(now: number): OrchestratorState {
  return {
    adminMode: "live",
    aggregates: { counts: zeroCounts(), total: 0 },
    families: [],
    familyByCode: {},
    queue: [],
    revealedIds: new Set(),
    familySeen: {},
    familyRevealedAt: {},
    familyRevealQueue: [],
    current: { mode: "welcome", target: null, since: now },
    currentReveal: null,
    montage: null,
    // Allow the first individual reveal to fire as soon as one is queued.
    lastRevealAt: now - LED_TIMING.revealInterval,
    revealsSinceDashboard: 0,
    lastDashboardAt: now,
    lastActivityAt: now,
  };
}

function revealView(sub: Submission, state: OrchestratorState): RevealView {
  return {
    participantId: sub.participantId,
    firstName: sub.firstName,
    role: sub.role,
    primary: sub.primary,
    selfieUrl: sub.selfieUrl,
    familyName: sub.familyCode
      ? state.familyByCode[sub.familyCode]?.name ?? null
      : null,
  };
}

function familyView(family: LedFamily): FamilyView {
  const mix =
    family.members.length >= 2
      ? familyMix(
          family.members.map((m) => ({ primary: m.primary, role: m.role })),
        )
      : null;
  return { code: family.code, name: family.name, members: family.members, mix };
}

/**
 * The first family pending a reveal whose throttle has elapsed and which still
 * has ≥ 2 submitted members. Throttled families stay queued for later.
 */
function nextDueFamily(state: OrchestratorState, now: number): string | null {
  for (const code of state.familyRevealQueue) {
    const family = state.familyByCode[code];
    if (!family || family.members.length < 2) continue;
    const last = state.familyRevealedAt[code] ?? Number.NEGATIVE_INFINITY;
    if (now - last >= LED_TIMING.familyThrottle) return code;
  }
  return null;
}

/** Largest family (≥ 2 members) to spotlight for an admin Photo Moment. */
function pickPhotoFamily(state: OrchestratorState): string | null {
  let best: string | null = null;
  let bestLen = -1;
  for (const family of state.families) {
    const len = family.members.length;
    if (len < 2) continue;
    if (len > bestLen || (len === bestLen && (best === null || family.code < best))) {
      best = family.code;
      bestLen = len;
    }
  }
  return best;
}

function shouldDashboard(state: OrchestratorState, now: number): boolean {
  if (state.aggregates.total <= 0) return false;
  if (state.revealsSinceDashboard >= LED_TIMING.dashboardAfterReveals) return true;
  return now - state.lastDashboardAt >= LED_TIMING.dashboardMaxInterval;
}

// ---------------------------------------------------------------------------
// Poll ingestion — merge new data into state (enqueue reveals, detect families)
// ---------------------------------------------------------------------------

function ingestPoll(
  state: OrchestratorState,
  data: LedStateResponse,
  now: number,
): OrchestratorState {
  const next: OrchestratorState = {
    ...state,
    adminMode: data.mode,
    aggregates: data.aggregates,
    families: data.families,
    familyByCode: Object.fromEntries(data.families.map((f) => [f.code, f])),
  };

  // Enqueue genuinely-new individual reveals — never a participant already
  // revealed (idempotent retakes never re-enqueue) or already queued.
  if (data.newSubmissions.length > 0) {
    const queued = new Set(state.queue.map((s) => s.participantId));
    const additions: Submission[] = [];
    for (const s of data.newSubmissions) {
      if (state.revealedIds.has(s.participantId) || queued.has(s.participantId)) continue;
      queued.add(s.participantId); // dedupe within this batch too
      additions.push(s);
    }
    if (additions.length > 0) next.queue = [...state.queue, ...additions];
    next.lastActivityAt = now;
  }

  // Family growth: a family newly at ≥ 2 members, or one that gained a member,
  // queues a reveal. Repeat growth before the reveal fires is coalesced (the
  // code sits in the queue once).
  let seen = state.familySeen;
  let revealQueue = state.familyRevealQueue;
  for (const family of data.families) {
    const count = family.members.length;
    const prev = state.familySeen[family.code] ?? 0;
    if (count <= prev) continue;
    if (seen === state.familySeen) seen = { ...state.familySeen };
    seen[family.code] = count;
    next.lastActivityAt = now;
    if (count >= 2 && !revealQueue.includes(family.code)) {
      if (revealQueue === state.familyRevealQueue) revealQueue = [...state.familyRevealQueue];
      revealQueue.push(family.code);
    }
  }
  if (seen !== state.familySeen) next.familySeen = seen;
  if (revealQueue !== state.familyRevealQueue) next.familyRevealQueue = revealQueue;

  return next;
}

// ---------------------------------------------------------------------------
// Segment selection — the ADR-0004 priority ladder
// ---------------------------------------------------------------------------

function chooseSegment(state: OrchestratorState, now: number): Choice {
  // Admin-forced modes win over everything (top priority).
  switch (state.adminMode) {
    case "paused":
    case "welcome":
      return { kind: "start", mode: "welcome", target: null };
    case "photo-moment": {
      const code = pickPhotoFamily(state);
      return code
        ? { kind: "start", mode: "photo-moment", target: code }
        : { kind: "start", mode: "welcome", target: null };
    }
    case "live":
      break;
  }

  const cur = state.current;
  const elapsed = now - cur.since;

  // Hold event segments for their minimum screen time so nothing flickers.
  // (A due family reveal may still preempt the dashboard — checked below.)
  if (cur.mode === "active-join" && elapsed < LED_TIMING.revealHold) return { kind: "hold" };
  if (cur.mode === "family-mix" && elapsed < LED_TIMING.familyHold) return { kind: "hold" };
  if (cur.mode === "photo-moment" && elapsed < LED_TIMING.photoHold) return { kind: "hold" };
  if (cur.mode === "montage" && elapsed < LED_TIMING.montageHold) return { kind: "hold" };

  // Family Reveal — highest automatic priority; preempts even the dashboard.
  const family = nextDueFamily(state, now);
  if (family) return { kind: "start", mode: "family-mix", target: family };

  // Dashboard holds its screen time (only a family reveal, handled above, cuts it).
  if (cur.mode === "stats" && elapsed < LED_TIMING.dashboardHold) return { kind: "hold" };

  // Flood → montage burst.
  if (state.queue.length > LED_TIMING.floodThreshold) {
    return { kind: "start", mode: "montage", target: null };
  }

  // Scheduled Community Dashboard cut.
  if (shouldDashboard(state, now)) return { kind: "start", mode: "stats", target: null };

  // Individual Reveal on cadence.
  if (state.queue.length > 0 && now - state.lastRevealAt >= LED_TIMING.revealInterval) {
    return { kind: "start", mode: "active-join", target: null };
  }

  // Quiet → Idle/Welcome (the join QR).
  if (state.queue.length === 0 && now - state.lastActivityAt >= LED_TIMING.idleAfter) {
    return { kind: "start", mode: "welcome", target: null };
  }

  // Base ambient live wall (or Welcome when nobody is on it yet).
  return state.families.length > 0
    ? { kind: "start", mode: "cluster-wall", target: null }
    : { kind: "start", mode: "welcome", target: null };
}

// ---------------------------------------------------------------------------
// Segment start — apply the accounting for entering a new segment
// ---------------------------------------------------------------------------

function startSegment(
  state: OrchestratorState,
  desired: Desired,
  now: number,
): OrchestratorState {
  const next: OrchestratorState = {
    ...state,
    current: { mode: desired.mode, target: desired.target, since: now },
  };

  switch (desired.mode) {
    case "active-join": {
      const [head, ...rest] = state.queue;
      next.queue = rest;
      next.currentReveal = head ?? null;
      if (head) {
        const ids = new Set(state.revealedIds);
        ids.add(head.participantId);
        next.revealedIds = ids;
      }
      next.lastRevealAt = now;
      next.revealsSinceDashboard = state.revealsSinceDashboard + 1;
      break;
    }
    case "family-mix": {
      const code = desired.target;
      if (code) {
        next.familyRevealedAt = { ...state.familyRevealedAt, [code]: now };
        next.familyRevealQueue = state.familyRevealQueue.filter((c) => c !== code);
      }
      break;
    }
    case "photo-moment": {
      const code = desired.target;
      if (code) next.familyRevealedAt = { ...state.familyRevealedAt, [code]: now };
      break;
    }
    case "stats": {
      next.lastDashboardAt = now;
      next.revealsSinceDashboard = 0;
      break;
    }
    case "montage": {
      const faces = state.queue
        .slice(0, LED_TIMING.montageFaces)
        .map((s) => revealView(s, state));
      const ids = new Set(state.revealedIds);
      for (const s of state.queue) ids.add(s.participantId);
      next.montage = { count: state.queue.length, faces };
      next.revealedIds = ids;
      next.queue = [];
      next.lastRevealAt = now;
      // Favour the dashboard once the burst clears (ADR-0004).
      next.revealsSinceDashboard = LED_TIMING.dashboardAfterReveals;
      break;
    }
    case "welcome":
    case "cluster-wall":
      break;
  }

  return next;
}

// ---------------------------------------------------------------------------
// Directive construction
// ---------------------------------------------------------------------------

function baseDirective(state: OrchestratorState): LedDirective {
  if (state.families.length === 0) {
    return { mode: "welcome", key: "welcome", payload: {} };
  }
  return {
    mode: "cluster-wall",
    key: "cluster-wall",
    payload: { families: state.families, total: state.aggregates.total },
  };
}

function buildDirective(state: OrchestratorState, desired: Desired): LedDirective {
  switch (desired.mode) {
    case "welcome":
      return { mode: "welcome", key: "welcome", payload: {} };

    case "cluster-wall":
      return {
        mode: "cluster-wall",
        key: "cluster-wall",
        payload: { families: state.families, total: state.aggregates.total },
      };

    case "active-join": {
      const sub = state.currentReveal;
      if (!sub) return baseDirective(state);
      return {
        mode: "active-join",
        key: `join:${sub.participantId}`,
        payload: { reveal: revealView(sub, state), families: state.families },
      };
    }

    case "family-mix": {
      const family = desired.target ? state.familyByCode[desired.target] : undefined;
      if (!family) return baseDirective(state);
      return {
        mode: "family-mix",
        key: `mix:${family.code}`,
        payload: { family: familyView(family), families: state.families },
      };
    }

    case "photo-moment": {
      const family = desired.target ? state.familyByCode[desired.target] : undefined;
      if (!family) return { mode: "welcome", key: "welcome", payload: {} };
      return {
        mode: "photo-moment",
        key: `photo:${family.code}`,
        payload: { family: familyView(family) },
      };
    }

    case "stats":
      return {
        mode: "stats",
        key: `stats:${state.lastDashboardAt}`,
        payload: {
          counts: state.aggregates.counts,
          total: state.aggregates.total,
          familyCount: state.families.length,
        },
      };

    case "montage": {
      const montage = state.montage ?? { count: 0, faces: [] };
      return {
        mode: "montage",
        key: `montage:${state.current.since}`,
        payload: { count: montage.count, faces: montage.faces, total: state.aggregates.total },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// The reducer
// ---------------------------------------------------------------------------

/**
 * Advance the orchestrator by one event. Pure: returns a fresh state + the
 * directive to render, and never mutates `state`. A `poll` merges new repo data
 * first; both event kinds then resolve the current directive by the ADR-0004
 * priority ladder, applying segment accounting on a transition.
 */
export function reduceLed(
  state: OrchestratorState,
  event: LedEvent,
): { state: OrchestratorState; directive: LedDirective } {
  const merged = event.type === "poll" ? ingestPoll(state, event.data, event.now) : state;
  const choice = chooseSegment(merged, event.now);

  // Hold: keep the current segment untouched and re-render it with fresh data.
  if (choice.kind === "hold") {
    const held: Desired = { mode: merged.current.mode, target: merged.current.target };
    return { state: merged, directive: buildDirective(merged, held) };
  }

  // Start: a transition — or a re-fired individual reveal (same mode/target, but a
  // new participant must be dequeued). Unchanged base modes keep their segment so
  // ticks don't churn state or reset `since`.
  const desired: Desired = { mode: choice.mode, target: choice.target };
  const sameSegment =
    choice.mode === merged.current.mode && choice.target === merged.current.target;
  const next =
    sameSegment && choice.mode !== "active-join"
      ? merged
      : startSegment(merged, desired, event.now);
  return { state: next, directive: buildDirective(next, desired) };
}
