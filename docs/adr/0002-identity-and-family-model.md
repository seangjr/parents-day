# 0002 — Identity & family model

Status: accepted

## Context

No accounts (one-off event). The Family Love Mix is the core emotional payload, but members are on separate phones and arrive at different times. The brief offered three conflicting family-linking mechanics and a Parent-Child Contrast that the single-score quiz cannot actually compute.

## Decision

- **Participant** = anonymous, identified by a client-generated id; **retake overwrites** (idempotent) so community counters don't inflate. **One Participant per device.**
- **Family** is uniquely identified by a **server-minted Family Code** (confusion-safe alphabet), never by its display name. Members create/join via the code or a join-QR, with a confirm step. The display name is a non-unique label.
- **Membership is open for the whole live event**; the Family Love Mix is recomputed live on each join. **Size cap 10.** No self-leave — only admin removes a member.
- **Role** (Parent / Child / Grandparent / Guardian / Other) is logic-bearing: Parent/Grandparent/Guardian group as **parent-figures** vs **children** (Child) for the contrast, and `Child` flags guardian consent.

## Considered options

- **Multi-per-device** (shared phones) — rejected for simplicity; accepted consequence below.
- **Family name only / name + last-4-phone** — rejected: name collides in a shared foyer; phone adds PII and still isn't unique.
- **True give-vs-receive contrast** (two sub-scores per person) — rejected: doubles the tie problem on a 1-minute quiz. Reworded to a dominant-style comparison across role groups.

## Consequences

- **Shared-phone families under-count**: a child without their own phone won't appear individually or in the mix. Known and accepted — do not "fix" without revisiting this ADR.
- The Parent-Child Contrast compares **dominant styles by role group**, NOT giving vs receiving. Result copy must not claim give/receive.
