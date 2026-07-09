# 0001 — Serverless (Vercel) + Redis state + LED polling + client-first results

Status: accepted

## Context

Parents Day is a **one-off, single-venue** event at Medium scale (peak ~20–60 submissions/min, ~150–600 attendees). Deployment target is **Vercel**. Vercel Functions are serverless: no long-lived in-process state, and WebSocket support (public beta, Jun 2026) drops connections at the function max duration and still requires an external store for durable state. The LED is a **single browser client** on the `/led` route projected onto the physical screen; realtime "fan-out" is effectively one screen + one admin, not a crowd.

## Decision

- Host on **Vercel (Next.js)**, region **`sin1`** (closest to Malaysia).
- **State authority is Upstash Redis** (Vercel Marketplace): live love-style counters, family records, and an append-only submission log consumed by cursor. Throwaway — flushed after the event.
- The **LED `/led` client polls** a read endpoint every ~1–2s and drains the submission queue at its own pace (flood control is intrinsic). No WebSocket, no managed pub/sub.
- The **personal quiz result is computed client-first** from the 5 answers via a **single shared TS module** used by both client and server, so the result never depends on connectivity; the server submission (for LED + family mix) is **best-effort with retry**.

## Considered options

- **Long-running stateful Node service + WebSocket** — rejected: fights the chosen Vercel platform; serverless can't hold an in-memory authority.
- **Vercel WebSockets (beta) / managed realtime (Ably, Pusher) / SSE** — rejected for a single-LED one-off: beta risk, duration-drop reconnects, or an extra vendor for no fan-out benefit.
- **Server-authoritative results** — rejected: makes each person's personal result hostage to congested foyer wifi.

## Consequences

- Hard dependency on venue internet; no offline mode. LED needs a dedicated line / 4G-5G router; phones use their own mobile data (distributes load).
- Result logic lives in one shared module (client + server) to prevent drift.
- Reveal latency is polling-bounded (~1–2s), imperceptible in a foyer.
