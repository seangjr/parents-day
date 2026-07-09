# 0006 — Admin auth via shared secret

Status: accepted

## Context

One-off internal event, single operator, no user accounts. The admin console (`/admin`) and the LED (`/led`) must be gated, but the participant app must stay open to anyone who scans the QR.

## Decision

Gate `/admin` and `/led` behind a **single shared secret** (env-configured token/password) checked in **Vercel Routing Middleware**. Participant routes remain open. No accounts, no roles.

## Considered options

- **Vercel Deployment Protection** (whole-deployment password) — rejected: it would also gate the participant app, which must be publicly reachable.
- **Full auth** (Sign in with Vercel / an identity provider) — rejected: overkill for a single-operator, one-day console.

## Consequences

- No per-person audit trail (one shared password) — acceptable for a single operator.
- **Do NOT enable Vercel's built-in Deployment Protection to "secure" this app** — it would lock out participants. Protection is route-scoped in middleware by design.
