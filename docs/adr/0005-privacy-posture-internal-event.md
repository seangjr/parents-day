# 0005 — Privacy posture for an internal event

Status: accepted

## Context

Parents Day runs as an **internal, in-person-moderated** event: the organisers control who is in the room and supervise the LED live. Names and optional selfies appear on the foyer screen.

## Decision

- **No consent flow.** Names, results, and optional selfies appear on the LED without consent checkboxes or guardian toggles.
- **No moderation pipeline.** No pre-approval gate; content moderation is handled in person by the organisers. The admin console keeps a basic **remove-item** safety valve.
- **Optional selfies** are captured at the profile step (skippable), stored in **private Vercel Blob**, and referenced from the Submission in Redis.
- **Retention:** all data (Redis keys + Blob objects) is purged at the admin post-event **reset**; nothing persists. Upstash + Blob resources are torn down after the event (throwaway, per ADR-0001).

## Considered options

- **Full consent + moderation** (checkboxes, guardian consent, pre-approval queue, kids-as-cards-only) — rejected as disproportionate for an internal, human-moderated, one-off event.

## Consequences

- **This posture is valid ONLY because the event is internal and human-moderated.** If this experience is ever run for a public audience, consent capture, a moderation gate, and child-photo safeguarding MUST be added back before launch. Do not reuse this configuration publicly.
