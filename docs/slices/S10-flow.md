# Slice S10 — Mobile flow rework to match Figma (Mobile 1–9)

Isolated git worktree on branch `slice/s10-flow`. RESTRUCTURE the existing screens into
the real Figma flow. Most building blocks already exist — REUSE and rewire them; do not
rebuild from scratch.

## Read first (authoritative layouts)
- `docs/figma/mobile-1-welcome.md` … `docs/figma/mobile-9-submitted.md` — exact Figma layout +
  copy per screen. Match structure & copy, but use OUR tokens + components (never Figma's raw
  classes or `localhost:3845/assets/...` URLs; use lucide icons).
- `docs/SPEC.md`, `CONTEXT.md`, `docs/adr/0002` (family), `0003` (scoring), `0005` (privacy).

## Already built — REUSE (adapt, don't rebuild)
- `app/api/family/**` (create / join / [code]) — the family API. Keep as-is.
- `components/family/**` (create-family, join-family, join-qr, code-display, family-mix, mix-bar, use-my-family) — reuse/adapt to Figma.
- `components/quiz/**` (profile-form, quiz-runner, result-reveal, selfie-field, questions) — reuse/adapt.
- `components/ui/*`, `components/animation/*` (`SplitReveal`, `Odometer`, `TracedScript`), `components/led/family-constellation.tsx`.
- `lib/scoring.ts` (`scoreQuiz`, `familyMix`), `lib/love-styles.ts` (`LOVE_STYLES`, **`displayLabel(style)`** for the shown result), `lib/repo/index.ts`, `lib/submit-client.ts`, `app/api/submit`, `app/api/community`, `lib/participant.ts`.

## The fix — welcome@root + family-first 4-step wizard + submitted
Wire the pieces into ONE flow (screens map 1:1 to the Figma files):
1. **`/` = Welcome** (Mobile 1): FGA / PARENTS DAY 2026, `TracedScript` "Love Revealed", tagline,
   **BEGIN** → Step 1, "Already have a family code?" → Join.  (Currently `/` is a design-system landing — replace it. Gallery stays at `/design-system`.)
2. **Step 1 of 4 — Create/Join Family** (Mobile 2→3/4): reuse `components/family/*` + `app/api/family/*`.
3. **Step 2 of 4 — Profile + Selfie** (Mobile 5): reuse `profile-form`/`selfie-field`; consent checkbox default-checked, **non-blocking**.
4. **Step 3 of 4 — Quiz** (Mobile 6/7): reuse `quiz-runner`; result computed client-side (`scoreQuiz`).
5. **Step 4 of 4 — Result** (Mobile 8): reuse `result-reveal`; show label via **`displayLabel(style)`** (never hardcode).
6. **Submitted** (Mobile 9): "You're on the wall" + submission-details card + DONE; on entry fire `lib/submit-client`.
   Build this screen (it's missing today).

Ensure the four steps show "STEP n OF 4" and share wizard state (`lib/participant.ts`: participant id,
family code+name, first name, role, selfie, answers — `localStorage`).

## Constraints (STRICT)
- Root `/` MUST render Welcome. Do NOT touch `/design-system`.
- Touch ONLY: `app/page.tsx`, `app/(experience)/**`, `app/family/**`, `components/quiz/**`,
  `components/family/**`, `lib/participant.ts`. Additive `app/globals.css` tweaks OK.
  Do NOT modify `app/api/**`, `components/ui/*`, `components/animation/*`, `lib/scoring*`,
  `lib/repo/*`, `lib/love-styles.ts`, `app/layout.tsx`, `package.json`.
- Remove any now-dead/duplicate routes you replace (no orphan screens).
- `bunx tsc --noEmit` green; smoke with `next dev` if useful. No full build, no format, no deps.
- Commit: `git add -A && git commit -m "feat(s10): mobile flow matching Figma — welcome@root, family-first 4-step + submitted"`.
