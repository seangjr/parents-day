import { describe, test, expect } from "bun:test";
import type { Aggregates, Submission } from "@/lib/repo";
import { LOVE_STYLE_ORDER, type LoveStyleId } from "@/lib/love-styles";
import {
  LED_TIMING,
  initialLedState,
  reduceLed,
  type LedDirective,
  type LedFamily,
  type LedStateResponse,
  type OrchestratorState,
} from "./led-orchestrator";

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function sub(
  id: string,
  primary: LoveStyleId = "sayang",
  extra: Partial<Submission> = {},
): Submission {
  return {
    participantId: id,
    firstName: id,
    role: "child",
    familyCode: null,
    primary,
    selfieUrl: null,
    ts: 0,
    ...extra,
  };
}

function aggregates(total: number): Aggregates {
  const counts = {} as Record<LoveStyleId, number>;
  for (const id of LOVE_STYLE_ORDER) counts[id] = 0;
  if (total > 0) counts.sayang = total;
  return { counts, total };
}

function family(
  code: string,
  members: { firstName: string; primary?: LoveStyleId; role?: LedFamily["members"][number]["role"] }[],
  memberCount = members.length,
): LedFamily {
  return {
    code,
    name: `The ${code} Family`,
    memberCount,
    members: members.map((m) => ({
      firstName: m.firstName,
      role: m.role ?? "child",
      primary: m.primary ?? "sayang",
    })),
  };
}

function pollData(over: Partial<LedStateResponse> = {}): LedStateResponse {
  return {
    cursor: 0,
    newSubmissions: [],
    aggregates: aggregates(0),
    joinedTotal: 0,
    families: [],
    mode: "live",
    ...over,
  };
}

/** Drive a poll event and return the fresh state + directive. */
function poll(state: OrchestratorState, now: number, data: Partial<LedStateResponse>) {
  return reduceLed(state, { type: "poll", now, data: pollData(data) });
}

/** Drive a timing-only tick. */
function tick(state: OrchestratorState, now: number) {
  return reduceLed(state, { type: "tick", now });
}

// ---------------------------------------------------------------------------
// Boot + base
// ---------------------------------------------------------------------------

describe("boot + base modes", () => {
  test("boots to the Welcome/idle screen with no data", () => {
    const { directive } = tick(initialLedState(0), 0);
    expect(directive.mode).toBe("welcome");
  });

  test("shows a joined Family before its first Quiz result", () => {
    const { state, directive } = poll(initialLedState(0), 0, {
      joinedTotal: 1,
      families: [family("TAN", [], 1)],
    });
    expect(directive.mode).toBe("cluster-wall");
    if (directive.mode !== "cluster-wall") throw new Error("unreachable");
    expect(directive.payload.featuredFamilyCode).toBe("TAN");
    expect(directive.payload.total).toBe(1);
    expect(state.queue).toHaveLength(0);
    expect(state.familyRevealQueue).toHaveLength(0);
  });

  test("cycles ambient focus through Families in stable order", () => {
    const started = poll(initialLedState(0), 0, {
      families: [
        family("TAN", [{ firstName: "Sarah" }]),
        family("LEE", [{ firstName: "Aaron" }]),
      ],
    });
    expect(started.directive.mode).toBe("cluster-wall");
    if (started.directive.mode !== "cluster-wall") throw new Error("unreachable");
    expect(started.directive.payload.featuredFamilyCode).toBe("TAN");

    const held = tick(started.state, LED_TIMING.ambientFamilyHold - 1);
    expect(held.directive.mode).toBe("cluster-wall");
    if (held.directive.mode !== "cluster-wall") throw new Error("unreachable");
    expect(held.directive.payload.featuredFamilyCode).toBe("TAN");

    const next = tick(started.state, LED_TIMING.ambientFamilyHold);
    expect(next.directive.mode).toBe("cluster-wall");
    if (next.directive.mode !== "cluster-wall") throw new Error("unreachable");
    expect(next.directive.payload.featuredFamilyCode).toBe("LEE");

    const wrapped = tick(next.state, LED_TIMING.ambientFamilyHold * 2);
    expect(wrapped.directive.mode).toBe("cluster-wall");
    if (wrapped.directive.mode !== "cluster-wall") throw new Error("unreachable");
    expect(wrapped.directive.payload.featuredFamilyCode).toBe("TAN");
  });

  test("falls back to Welcome when no families are on the wall yet", () => {
    const { directive } = poll(initialLedState(0), 0, { aggregates: aggregates(3) });
    expect(directive.mode).toBe("welcome");
  });
});

// ---------------------------------------------------------------------------
// Individual reveals + cadence
// ---------------------------------------------------------------------------

describe("individual reveals + cadence", () => {
  test("reveals a queued submission and dequeues it", () => {
    const { state, directive } = poll(initialLedState(0), 0, {
      newSubmissions: [sub("A")],
      aggregates: aggregates(1),
    });
    expect(directive.mode).toBe("active-join");
    if (directive.mode !== "active-join") throw new Error("unreachable");
    expect(directive.payload.reveal.participantId).toBe("A");
    expect(state.queue).toHaveLength(0);
    expect(state.revealedIds.has("A")).toBe(true);
  });

  test("holds one reveal, then paces the next by ~revealInterval", () => {
    let s = poll(initialLedState(0), 0, {
      newSubmissions: [sub("A"), sub("B")],
      aggregates: aggregates(2),
    }).state; // reveals A at t=0, B queued

    // Mid-hold: still A, B waits.
    const mid = tick(s, 3000);
    expect(mid.directive.mode).toBe("active-join");
    if (mid.directive.mode !== "active-join") throw new Error("unreachable");
    expect(mid.directive.payload.reveal.participantId).toBe("A");

    // One interval later: B reveals.
    const next = tick(s, LED_TIMING.revealInterval);
    expect(next.directive.mode).toBe("active-join");
    if (next.directive.mode !== "active-join") throw new Error("unreachable");
    expect(next.directive.payload.reveal.participantId).toBe("B");
    s = next.state;
    expect(s.queue).toHaveLength(0);
  });

  test("returns to base after the reveal hold with an empty queue", () => {
    const s = poll(initialLedState(0), 0, {
      newSubmissions: [sub("A")],
      aggregates: aggregates(1),
    }).state;
    const after = tick(s, LED_TIMING.revealHold + 100);
    expect(after.directive.mode).not.toBe("active-join");
  });

  test("cuts to the dashboard after ~N reveals", () => {
    const n = LED_TIMING.dashboardAfterReveals; // 7
    const subs = Array.from({ length: n + 1 }, (_, i) => sub(`A${i}`));
    let s = poll(initialLedState(0), 0, {
      newSubmissions: subs,
      aggregates: aggregates(n + 1),
    }).state; // A0 revealed at t=0

    let revealed = 1;
    let t = 0;
    // Reveal A1..A(n-1) on cadence until the Nth reveal is shown.
    while (revealed < n) {
      t += LED_TIMING.revealInterval;
      const r = tick(s, t);
      s = r.state;
      expect(r.directive.mode).toBe("active-join");
      revealed += 1;
    }
    // Next selection point: the dashboard preempts the (n+1)th individual.
    const cut = tick(s, t + LED_TIMING.revealInterval);
    expect(cut.directive.mode).toBe("stats");
    expect(cut.state.revealsSinceDashboard).toBe(0);
    // The undisplayed submission is still queued for later.
    expect(cut.state.queue).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Family reveals — priority, throttle, coalescing
// ---------------------------------------------------------------------------

describe("family reveals", () => {
  test("a family reaching two members reveals, beating a queued individual", () => {
    const { state, directive } = poll(initialLedState(0), 0, {
      newSubmissions: [sub("X")],
      families: [family("TAN", [{ firstName: "Sarah" }, { firstName: "Daniel" }])],
      aggregates: aggregates(3),
    });
    expect(directive.mode).toBe("family-mix");
    if (directive.mode !== "family-mix") throw new Error("unreachable");
    expect(directive.payload.family.code).toBe("TAN");
    expect(directive.payload.family.mix).not.toBeNull();
    // Individual X still waits its turn; family was higher priority.
    expect(state.queue.map((q) => q.participantId)).toEqual(["X"]);
    expect(state.familyRevealQueue).toHaveLength(0);
    expect(state.familyRevealedAt.TAN).toBe(0);
  });

  test("re-reveal is throttled, then fires again after the window", () => {
    const tan2 = [{ firstName: "Sarah" }, { firstName: "Daniel" }];
    // First reveal at t=0.
    let s = poll(initialLedState(0), 0, {
      families: [family("TAN", tan2)],
      aggregates: aggregates(2),
    }).state;
    expect(s.current.mode).toBe("family-mix");

    // Grows to 3 within the throttle window → no immediate re-reveal.
    const grown = poll(s, 10_000, {
      families: [family("TAN", [...tan2, { firstName: "Mei" }])],
      newSubmissions: [sub("solo")],
      aggregates: aggregates(3),
    });
    expect(grown.directive.mode).not.toBe("family-mix");
    s = grown.state;

    // After the throttle elapses, the grown family re-reveals.
    const later = tick(s, LED_TIMING.familyThrottle + 1);
    expect(later.directive.mode).toBe("family-mix");
    if (later.directive.mode !== "family-mix") throw new Error("unreachable");
    expect(later.directive.payload.family.members).toHaveLength(3);
  });

  test("coalesces growth arriving while another segment holds", () => {
    // An individual reveal is on screen (holds the wall).
    let s = poll(initialLedState(0), 0, {
      newSubmissions: [sub("X")],
      aggregates: aggregates(1),
    }).state;
    expect(s.current.mode).toBe("active-join");

    // Family reaches 2 while the reveal holds.
    s = poll(s, 1000, {
      families: [family("TAN", [{ firstName: "Sarah" }, { firstName: "Daniel" }])],
      aggregates: aggregates(3),
    }).state;
    // Grows again before the reveal fires — coalesced into one queue entry.
    s = poll(s, 2000, {
      families: [family("TAN", [{ firstName: "Sarah" }, { firstName: "Daniel" }, { firstName: "Mei" }])],
      aggregates: aggregates(4),
    }).state;
    expect(s.familyRevealQueue).toEqual(["TAN"]);

    // Once the hold ends, one reveal shows the current (3-member) family.
    const fire = tick(s, LED_TIMING.revealHold + 100);
    expect(fire.directive.mode).toBe("family-mix");
    if (fire.directive.mode !== "family-mix") throw new Error("unreachable");
    expect(fire.directive.payload.family.members).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Flood / montage
// ---------------------------------------------------------------------------

describe("flood / montage", () => {
  test("a backlog over the threshold switches to a montage burst", () => {
    const count = LED_TIMING.floodThreshold + 1; // 16
    const subs = Array.from({ length: count }, (_, i) => sub(`P${i}`));
    const { state, directive } = poll(initialLedState(0), 0, {
      newSubmissions: subs,
      aggregates: aggregates(count),
    });
    expect(directive.mode).toBe("montage");
    if (directive.mode !== "montage") throw new Error("unreachable");
    expect(directive.payload.count).toBe(count);
    expect(directive.payload.faces).toHaveLength(LED_TIMING.montageFaces);
    // The burst drains the queue and marks everyone revealed.
    expect(state.queue).toHaveLength(0);
    expect(state.revealedIds.size).toBe(count);
  });

  test("favours the dashboard once the burst clears", () => {
    const count = LED_TIMING.floodThreshold + 1;
    const subs = Array.from({ length: count }, (_, i) => sub(`P${i}`));
    const s = poll(initialLedState(0), 0, {
      newSubmissions: subs,
      aggregates: aggregates(count),
    }).state;
    const after = tick(s, LED_TIMING.montageHold + 100);
    expect(after.directive.mode).toBe("stats");
  });
});

// ---------------------------------------------------------------------------
// Idle
// ---------------------------------------------------------------------------

describe("idle", () => {
  test("keeps the ambient Family wall live after a quiet spell", () => {
    const s = poll(initialLedState(0), 0, {
      families: [family("TAN", [{ firstName: "Sarah" }])],
    }).state;
    expect(tick(s, 1000).directive.mode).toBe("cluster-wall");
    expect(tick(s, LED_TIMING.idleAfter + 1).directive.mode).toBe("cluster-wall");
  });
});

// ---------------------------------------------------------------------------
// Admin-forced modes (top priority)
// ---------------------------------------------------------------------------

describe("admin-forced modes", () => {
  test("paused freezes an in-progress reveal instead of dropping to Welcome", () => {
    // A live individual reveal is on screen (A).
    const started = poll(initialLedState(0), 0, {
      newSubmissions: [sub("A")],
      aggregates: aggregates(1),
    });
    expect(started.directive.mode).toBe("active-join");

    // Pausing past the reveal hold + cadence must HOLD that frame: still A, never
    // the idle Welcome QR — and the newly-arrived B is not advanced onto the wall.
    const paused = poll(started.state, LED_TIMING.revealInterval, {
      mode: "paused",
      newSubmissions: [sub("B")],
      aggregates: aggregates(2),
    });
    expect(paused.directive.mode).toBe("active-join");
    if (paused.directive.mode !== "active-join") throw new Error("unreachable");
    expect(paused.directive.payload.reveal.participantId).toBe("A");
    expect(paused.state.queue.map((q) => q.participantId)).toEqual(["B"]);
    // The segment is frozen — `since` is not reset by the hold.
    expect(paused.state.current.since).toBe(0);
  });

  test("paused holds the cluster wall rather than the join QR", () => {
    const live = poll(initialLedState(0), 0, {
      families: [family("TAN", [{ firstName: "Sarah" }])],
    });
    expect(live.directive.mode).toBe("cluster-wall");

    const paused = poll(live.state, 1000, {
      mode: "paused",
      families: [family("TAN", [{ firstName: "Sarah" }])],
    });
    expect(paused.directive.mode).toBe("cluster-wall");
  });

  test("welcome is forced", () => {
    const { directive } = poll(initialLedState(0), 0, {
      mode: "welcome",
      families: [family("TAN", [{ firstName: "S" }, { firstName: "D" }])],
      aggregates: aggregates(2),
    });
    expect(directive.mode).toBe("welcome");
  });

  test("photo-moment spotlights the largest eligible family", () => {
    const { directive } = poll(initialLedState(0), 0, {
      mode: "photo-moment",
      families: [
        family("LEE", [{ firstName: "Aaron" }, { firstName: "Rachel" }]),
        family("TAN", [{ firstName: "S" }, { firstName: "D" }, { firstName: "M" }]),
      ],
      aggregates: aggregates(5),
    });
    expect(directive.mode).toBe("photo-moment");
    if (directive.mode !== "photo-moment") throw new Error("unreachable");
    expect(directive.payload.family.code).toBe("TAN");
  });

  test("photo-moment with no eligible family keeps the ambient wall live", () => {
    const { directive } = poll(initialLedState(0), 0, {
      mode: "photo-moment",
      families: [family("TAN", [{ firstName: "Solo" }])],
      aggregates: aggregates(1),
    });
    expect(directive.mode).toBe("cluster-wall");
    if (directive.mode !== "cluster-wall") throw new Error("unreachable");
    expect(directive.payload.featuredFamilyCode).toBe("TAN");
  });
});

// ---------------------------------------------------------------------------
// Purity / determinism + retake handling
// ---------------------------------------------------------------------------

describe("purity + retakes", () => {
  test("is deterministic and does not mutate the input state", () => {
    const s = poll(initialLedState(0), 0, {
      newSubmissions: [sub("A"), sub("B")],
      aggregates: aggregates(2),
    }).state;

    const beforeQueue = s.queue.length;
    const beforeRevealed = s.revealedIds.size;

    const first = tick(s, LED_TIMING.revealInterval);
    const second = tick(s, LED_TIMING.revealInterval);

    // Same input ⇒ same directive.
    expect(first.directive).toEqual(second.directive);
    // Input state untouched.
    expect(s.queue.length).toBe(beforeQueue);
    expect(s.revealedIds.size).toBe(beforeRevealed);
    expect(s.current.mode).toBe("active-join");
  });

  test("an already-revealed participant is never re-enqueued", () => {
    let s = poll(initialLedState(0), 0, {
      newSubmissions: [sub("A")],
      aggregates: aggregates(1),
    }).state; // A revealed
    expect(s.revealedIds.has("A")).toBe(true);

    // A resent A (retake / duplicate log) does not re-queue.
    s = poll(s, 1000, { newSubmissions: [sub("A")], aggregates: aggregates(1) }).state;
    expect(s.queue).toHaveLength(0);
  });

  test("deduplicates repeated ids within a single batch", () => {
    const s = poll(initialLedState(0), 0, {
      newSubmissions: [sub("A"), sub("A"), sub("B")],
      aggregates: aggregates(2),
    }).state; // A revealed immediately, only one A + one B ever queued
    expect(s.revealedIds.has("A")).toBe(true);
    expect(s.queue.map((q) => q.participantId)).toEqual(["B"]);
  });
});

// A compile-time nudge that the directive union stays exhaustively handled.
const _modes: LedDirective["mode"][] = [
  "welcome",
  "cluster-wall",
  "active-join",
  "family-mix",
  "photo-moment",
  "stats",
  "montage",
];
void _modes;
