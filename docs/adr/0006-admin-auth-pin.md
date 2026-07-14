# 0006 — Admin auth via six-digit event PIN

Status: accepted

## Context

One-off internal event, single operator, no user accounts. The admin console (`/admin`) and the LED (`/led`) must be gated, but the participant app must stay open to anyone who scans the QR.

## Decision

Gate `/admin`, `/led`, and their APIs behind one **six-digit event PIN** from `ADMIN_PIN`, checked in **Next.js Proxy**. A same-origin form POST exchanges the PIN for a 12-hour httpOnly cookie; the credential never enters the URL. Participant routes remain open. Production fails closed when the PIN is missing or malformed. No accounts, no roles.

## Considered options

- **Vercel Deployment Protection** (whole-deployment password) — rejected: it would also gate the participant app, which must be publicly reachable.
- **Full auth** (Sign in with Vercel / an identity provider) — rejected: overkill for a single-operator, one-day console.

## Consequences

- No per-person audit trail and only six digits of entropy — acceptable for a single-operator, one-day internal event; not suitable as internet-grade authentication for a public or long-lived deployment.
- **Do NOT enable Vercel's built-in Deployment Protection to "secure" this app** — it would lock out participants. Protection is route-scoped in middleware by design.
