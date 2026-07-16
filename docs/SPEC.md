# Spec — Love Revealed (Parents Day 2026)

> Synthesized from `CONTEXT.md` (glossary) and ADRs 0001–0006. Uses the domain
> vocabulary throughout. No issue tracker is wired for this repo, so this spec
> lives as a file; slice it with `decompose-into-slices` next.

## Problem Statement

Families come to the Parents Day event but rarely put words to *how* they each
give and receive love. There's no shared, in-the-moment way for a family — and
the wider room — to see and celebrate those differences together.

## Solution

A QR-based foyer experience. Each person opens a mobile web app, answers a
**Quiz** of five quick questions, and instantly gets a Malaysian-inspired
**Love Style**. People link into a **Family** via a short **Family Code**; once
two or more join, the app shows their **Family Love Mix**. A foyer **LED**
screen reveals results live — individual reveals, family mixes, a rolling
**Community Dashboard**, and periodic **Photo Moments** — turning private
answers into a collective moment. It runs for one internal event and is wiped
afterward.

## User Stories

### Participant — entry & identity
1. As a guest, I want to scan the foyer QR code and land on a welcoming page, so that I can start without installing anything.
2. As a guest, I want to start the Quiz in one tap, so that I'm not slowed by setup.
3. As a participant, I want to enter just my first name and role (Parent / Child / Grandparent / Guardian / Other), so that entry stays under ~15 seconds.
4. As a participant, I want the option to add a selfie but be able to skip it, so that I'm never blocked by the camera.
5. As a returning participant on the same phone, I want re-taking the Quiz to replace my previous result, so that the community counts don't double-count me.

### Participant — family linking
6. As the first family member, I want to create a Family with a display name and receive a short Family Code, so that others can join me.
7. As the family creator, I want a join-QR shown on my phone in addition to the code, so that others can join without typing.
8. As a later family member, I want to join by scanning the join-QR or typing the Family Code, so that I can link across our separate phones.
9. As a joiner, I want a confirmation ("You're joining The Tan Family — yes?"), so that a mistyped code doesn't put me in the wrong family.
10. As a late-arriving family member, I want to still join after others have already been revealed, so that I'm counted in the mix.

### Participant — quiz & result
11. As a participant, I want five forced-choice questions with large tap targets, so that I can finish in about a minute.
12. As a participant, I want a progress indicator, so that I know how far along I am.
13. As a participant, I want my result computed instantly on my phone even on weak wifi, so that I always see it.
14. As a participant, I want a single clear Love Style (with a "…with a bit of…" when I tie two, or "Rojak Love" when I'm all-mixed), so that the result feels true to me.
15. As a participant, I want a short warm description of my Love Style, so that it means something.
16. As a participant, I want to see my result appear on the big screen, so that I feel part of the room.

### Participant — family mix
17. As a participant whose family has ≥2 members, I want to see our Family Love Mix as counts and a proportional bar, so that I understand how we differ.
18. As a participant, I want a headline that names our family (Dominant / Parent-Child Contrast / Rojak / Two-Way), so that the mix has a story.
19. As a participant in a one-person family, I want a prompt to invite my family, so that I know how to unlock the mix.

### LED / community viewer
20. As someone in the foyer, I want the LED to show a full join QR before anyone joins a Family, then put a Family on the live wall as soon as its first member joins and keep the QR in the corner, so that participation is visible before Quiz results arrive.
21. As a participant, I want my individual reveal to animate on the LED shortly after I submit, so that the moment feels live.
22. As a family, I want our result-based Family Reveal to appear when two members have submitted and again when another result arrives, so that we can gather for a photo.
23. As a viewer, I want a live Community Dashboard of the five Love Styles with rolling numbers, so that I can see how the whole room loves.
24. As a family, I want a Photo Moment that spotlights us by name, so that we're invited to take a photo together.
25. As a viewer, I want the LED never to blank and to recover on reconnect, so that the experience feels reliable.

### Admin / operator
26. As an operator, I want to start and stop the experience, so that it only runs during the event.
27. As an operator, I want to set the LED mode (welcome / live / photo-moment / love-mix / paused), so that I can drive the room.
28. As an operator, I want to force a specific reveal or trigger a Photo Moment, so that I can time it to the programme.
29. As an operator, I want to view submissions and families with live counts, so that I can monitor participation.
30. As an operator, I want to remove any name or photo, so that I have a safety valve.
31. As an operator, I want to reset all event data afterward, so that nothing persists.
32. As an operator, I want `/admin` and `/led` gated by a six-digit event PIN, so that only staff reach them while participants stay open.

### Cross-cutting experience
33. As a participant, I want the whole layout to scale fluidly across phone sizes, so that it looks right on any device.
34. As a viewer, I want display headlines to fill their width and the script wordmark to draw on, so that the brand feels crafted.
35. As a participant on an older phone, I want the experience to stay fast and legible, so that I'm not left behind.

## Implementation Decisions

### Architecture (ADR-0001)
- Next.js on **Vercel** (region `sin1`). One-off, throwaway; no accounts, no multi-tenancy.
- **Upstash Redis** (Marketplace) is the single source of truth: love-style counters, family records, an explicit creation-order Family index, and an append-only submission log consumed by cursor. Flushed after the event.
- The **LED `/led` client polls** a read endpoint every ~1–2s; newly joined Family membership comes from the Family index, while completed-result reveals come from the Submission log. No WebSockets or managed pub/sub; polling doubles as flood control (LED drains the reveal queue at its own pace).
- **Client-first results**: the Quiz result is computed on the device from the five answers via a **single shared scoring module** imported by both client and server, so results never depend on connectivity. Server submission is best-effort with retry.
- Optional selfies stored in **private Vercel Blob**, referenced from the submission record.

### Identity & family (ADR-0002)
- **Participant**: anonymous, identified by a client-generated id; **one per device**; a retake is idempotent (overwrites the prior submission). Known consequence: shared-phone families under-count.
- **Family**: uniquely identified by a **server-minted Family Code** from a confusion-safe alphabet (no `O/0`, `I/1`); the display **Family Name** is a non-unique label. Join by code or join-QR, with a confirm step.
- **Membership**: open the whole event; a joined member appears on the LED immediately as a pending Family node, while the Family Love Mix recomputes when Quiz results arrive; **size cap 10**; no self-leave (admin removes).
- **Role** is logic-bearing: Parent/Grandparent/Guardian = "parent-figures", Child = "child".

### Scoring engine (ADR-0003) — the primary seam
A pure, deterministic module (shared client + server). Given five answers A–E:
- Each answer adds 1 to its Love Style. The **Primary Love Style** is the top style.
- **Two-way tie (2+2+1)** → "X, with a bit of Y", X = the tied style answered earliest.
- **Five-way tie (1×5)** → **Rojak Love**.
- **Only the primary counts** toward the Community Dashboard and Family Love Mix (hybrids/Rojak are display-only). A Rojak individual contributes their earliest-answered style.
- **Family Love Mix** (N≥2): counts of members by primary style + a proportional bar. No numeric percentages at family scale (percentages are community-scale only).
- **Family Archetype**, first match wins: (1) **Dominant** — one style holds the max and ≥ half; (2) **Parent-Child Contrast** — ≥1 parent-figure and ≥1 child with differing group dominants; (3) **Rojak Love Family** — ≥3 distinct styles; (4) **Two-Way** — exactly two styles tied.
- **Answer → style map:** A Sayang Words, B Lepak Love, C Help-Help Love, D Tapau Love, E Warm Hug Love.

### LED orchestration (ADR-0004)
- **Hybrid authority**: Redis holds coarse state (current mode set by admin + indexed Family membership + the submission queue + aggregates); the `/led` client owns fine-grained reveal timing and queue drain rate.
- **Modes**: Welcome/Idle, Individual Reveal, Family Reveal, Community Dashboard, Photo Moment.
- **Priority**: admin-forced > Photo Moment (admin) > Family Reveal (new/grown result set) > Individual Reveal > Community Dashboard > Idle.
- **Cadence**: ~1 individual reveal / 4–6s; cut to dashboard ~10–15s after every ~6–8 reveals or ~60s. In Live mode, a wall with joined Families stays ambient rather than returning to the full-screen QR: the QR transitions to the corner and Family focus rotates in stable order about every 10s. Joined members without a Quiz result render as anonymous pending nodes. The full-screen Welcome QR is reserved for an admin-forced Welcome or a wall with no joined Families. Growth-triggered result-based Family reveals remain throttled to ≤once / 3–5 min per Family; near-simultaneous submissions coalesce.
- **Counts**: “People joined” is the live Family-membership total and rolls independently from completed-result aggregates; Love Style counts include submitted results only.
- **Flood**: on backlog >~15, switch to a fast montage / "N people just joined" burst then favor the dashboard. Retakes don't re-enqueue.

### Privacy (ADR-0005) — internal event
- **No consent flow, no moderation pipeline.** Names/results/selfies show freely; the admin remove-item is the only moderation lever; organisers moderate in person.
- All data purged at admin reset. Valid **only** because the event is internal and human-moderated — a public run would require consent + moderation + child safeguarding.

### Admin auth (ADR-0006)
- One shared **six-digit event PIN** (`ADMIN_PIN`) is checked in Next.js Proxy, gating `/admin`, `/led`, and their APIs; participant routes stay open. A form POST exchanges the PIN for a 12-hour httpOnly cookie without placing the credential in a URL. Production fails closed when the PIN is missing or malformed. Do **not** use Vercel Deployment Protection (it would lock out participants).

### Design system (Figma reference + Osmo resources)
- **Palette:** Deep Olive Black `#10150F`, Shadow Black `#050705`, Moss `#3E4B2F`, Muted Olive `#68734C`, Soft Sage `#A8AD82`, Pale Lime `#F0F4A6`, Warm Cream `#F7F1C8`, plus love-accent Warm Beige `#D2B48C` and Soft Peach `#FFDAB9`.
- **Type:** Oooh Baby (display script), Big Shoulders Display ExtraBold/Bold (condensed, uppercase headings), Geist (body). Loaded via `next/font`.
- **Love-style visual map:** each Love Style → a lucide icon (message-square, orbit, hand-helping, star, heart) + accent color, in a shared module tying the domain to the visuals.
- **Tokens** live in Tailwind v4 `@theme` (colors, fonts, radii, the signature `--ease-smooth` `linear()` easing, glow shadow).
- **Osmo Scaling System**: `--size-font` driven from `:root` so rem-based utilities scale fluidly (design-in-px → viewport).
- **Osmo Fit-Text**: single-line headlines fill their container width (React wrapper over the verbatim utility).
- **Osmo Masked Text Reveal (GSAP SplitText)**: default reveal for sans (Geist / Big Shoulders) headings; `data-split` attributes intact, driven from `useEffect` with revert/kill cleanup.
- **Shared scene choreography:** `.motion-scene`, `.motion-enter`, `.motion-pop`, and `.motion-draw-line` provide one-shot, staggerable entrances for LED directives and participant-flow blocks. LED scene keys replay choreography only on segment changes; Odometers and other live values update in place. Quiz controls remain immediately interactive, with selection/press feedback kept under 300ms.
- **Reduced motion:** shared scene classes snap to their final state, SplitReveal text becomes immediately visible, Odometers snap to their value, route transitions are skipped, and the LED keeps the static image fallback instead of initializing the animated Unicorn background.
- **Osmo Number Odometer (GSAP)**: every fluctuating number (community counts, "N joined") rolls; live updates via the returned updater.
- **Oooh Baby SVG tracing**: the script wordmark draws on via `stroke-dashoffset`. Per the performance priority (§13), the glyph path is **pre-generated at build time** (opentype.js in a Node build script, or SVG exported from Figma) and shipped as static path data — **no opentype.js or font parsing on the client**.
- The Figma design system is a **strong reference, not a literal target**; the LED wall components are an area to improve on beyond the Figma.

### Current repo state (already done this session)
- Next.js 16 + React 19 + Tailwind 4 + TS scaffold at repo root; deps: `lucide-react`, `clsx`, `tailwind-merge`, `gsap`, `opentype.js`.
- Foundation written: `app/globals.css` (tokens + Osmo scaling + easing), `app/layout.tsx` (fonts), `lib/cn.ts`, `lib/love-styles.ts`, `lib/fit-text.ts`, `components/fit-text.tsx`.

## Testing Decisions

- **Good tests exercise external behavior, not implementation.** The richest, highest-value seam is the **pure scoring engine** — deterministic input (five answers, member sets, roles) → output (primary style, hybrid label, family mix counts, archetype). This is the one seam to test exhaustively (all tie shapes, archetype precedence, role grouping, edge N=1/2/10).
- **Data repository seam**: a repository interface over Redis (submissions, families, aggregates) tested against a real/ephemeral Redis or an in-memory fake — assert idempotent retake, family membership cap, live counter integrity.
- **API contract seam**: route handlers for submit / create-family / join-family / led-state — integration tests asserting the observable contract (status, shape, aggregate effects), not internals.
- **LED orchestrator**: a pure reducer (event state → current mode + next reveal) tested for priority order, throttling, and flood/montage behavior.
- Follow `/tdd` at these seams. Author tests via the Tester agent; assert behavior and invariants, not plumbing.

## Out of Scope

- Accounts, login, multi-event reuse, multi-tenancy.
- Consent capture, moderation queues, child-photo safeguarding pipelines (internal event only — would be required for any public run).
- Cross-device participant identity; shared-phone multi-person entry.
- WebSockets / managed realtime; long-term data retention or analytics.
- Deep giving-vs-receiving sub-scoring (single blended score only).

## Further Notes

- Reliability: LED on a dedicated line / 4G-5G router; phones use their own mobile data. LED never blanks; resyncs from the Redis cursor on reconnect.
- Speed target: 60–90s per person (profile ~15s, quiz ~45s, result ~10s).
- Accessibility: large tap targets, minimal typing, high contrast for foyer lighting, works on older phones, respects `prefers-reduced-motion` (odometer/reveals degrade to final state).
