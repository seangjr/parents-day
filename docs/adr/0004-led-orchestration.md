# 0004 — LED orchestration

Status: accepted

## Context

Serverless + polling (ADR-0001) can't run a persistent server-side scheduler. The LED is one browser on `/led`; the admin needs coarse control; reveals must be paced and flood-tolerant.

## Decision

- **Hybrid authority.** Redis holds coarse state — the current **mode** (welcome / live / photo-moment / paused, set by admin), an explicit creation-order **Family index**, the **submission queue** (append-only log consumed by cursor), and aggregates. The **`/led` client owns fine-grained timing**: which reveal to animate, pacing, when to cut to the dashboard, queue drain rate.
- **Modes:** Welcome/Idle, Individual Reveal, Family Reveal, Community Dashboard, Photo Moment.
- **Priority when several pend:** admin-forced mode > Photo Moment (admin) > Family Reveal (new/grown submitted result set) > Individual Reveal (queue) > Community Dashboard (periodic) > Idle/Welcome.
- **Cadence (within live):** ~1 individual reveal per 4–6s; cut to the dashboard ~10–15s after every ~6–8 reveals or ~60s.
- **Live idle / ambient wall:** once at least one member has joined a Family, that Family appears immediately and the LED stays on the ambient Family wall instead of returning to the full-screen join QR. Joined members without a Quiz result render as anonymous pending nodes. The same QR transitions into the corner, and the wall foregrounds each joined Family in stable round-robin order (~10s each). The full-screen Welcome QR is reserved for an admin-forced Welcome or a wall with no joined Families.
- **Family reveals:** fire when a Family reaches ≥2 submitted results or gains another result; **re-reveal throttled** to ≤ once per 3–5 min per Family; near-simultaneous member submissions coalesced into one reveal.
- **Counts:** Family membership and completed results are separate signals. “People joined” rolls from the current joined-member total; Love Style aggregates and individual reveals remain submission-based.
- **Flood policy:** the LED drains at its own rate (intrinsic backpressure). On a large submission backlog (> ~15 queued) it switches to a fast montage / "N people just joined" burst, then favors the dashboard — individuals already saw their result on their own phone, so none is experientially "missed". Retakes (idempotent) don't re-enqueue a reveal.

## Consequences

- Orchestration logic is split (Redis coarse mode + client fine timing) with clean responsibilities.
- Under surge the LED shows aggregates rather than every individual; acceptable because the personal reveal already happened on-device.
