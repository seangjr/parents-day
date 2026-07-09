# 0004 — LED orchestration

Status: accepted

## Context

Serverless + polling (ADR-0001) can't run a persistent server-side scheduler. The LED is one browser on `/led`; the admin needs coarse control; reveals must be paced and flood-tolerant.

## Decision

- **Hybrid authority.** Redis holds coarse state — the current **mode** (welcome / live / photo-moment / paused, set by admin), the **submission queue** (append-only log consumed by cursor), and aggregates. The **`/led` client owns fine-grained timing**: which reveal to animate, pacing, when to cut to the dashboard, queue drain rate.
- **Modes:** Welcome/Idle, Individual Reveal, Family Reveal, Community Dashboard, Photo Moment.
- **Priority when several pend:** admin-forced mode > Photo Moment (admin) > Family Reveal (new/grown) > Individual Reveal (queue) > Community Dashboard (periodic) > Idle/Welcome.
- **Cadence (within live):** ~1 individual reveal per 4–6s; cut to the dashboard ~10–15s after every ~6–8 reveals or ~60s; drop to Idle/Welcome after ~20–30s of no activity.
- **Family reveals:** fire when a family reaches ≥2 or gains a member; **re-reveal throttled** to ≤ once per 3–5 min per family; near-simultaneous member submissions coalesced into one reveal.
- **Flood policy:** the LED drains at its own rate (intrinsic backpressure). On a large backlog (> ~15 queued) it switches to a fast montage / "N people just joined" burst, then favors the dashboard — individuals already saw their result on their own phone, so none is experientially "missed". Retakes (idempotent) don't re-enqueue a reveal.

## Consequences

- Orchestration logic is split (Redis coarse mode + client fine timing) with clean responsibilities.
- Under surge the LED shows aggregates rather than every individual; acceptable because the personal reveal already happened on-device.
