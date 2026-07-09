# Slice S10 — Mobile flow rework to match Figma (Mobile 1–9)

Isolated git worktree on branch `slice/s10-flow`. This REPLACES the earlier ad-hoc
flow (S04) and family side-screens (S05) with the actual Figma screens, in order.

## Read first (authoritative layouts)
- `docs/figma/mobile-1-welcome.md` … `docs/figma/mobile-9-submitted.md` — the exact
  Figma layout + copy for each screen. Follow structure & copy closely, but convert
  to OUR design tokens + components — do NOT paste Figma's raw utility classes or its
  `localhost:3845/assets/...` URLs; use our components and lucide icons.
- `docs/SPEC.md`, `CONTEXT.md`, `docs/adr/0002` (family), `0003` (scoring), `0005` (privacy).
- Reuse (do NOT modify internals): `components/ui/*`, `components/animation/*`
  (`SplitReveal`, `Odometer`, `TracedScript`), `components/led/family-constellation.tsx`
  (cluster preview), `lib/scoring.ts` (`scoreQuiz`, `familyMix`), `lib/love-styles.ts`
  (`LOVE_STYLES`, and **`displayLabel(style)`** for the shown result name), `lib/repo/index.ts`
  (`getRepo`), `lib/submit-client.ts`, `app/api/submit`, `app/api/community`, `lib/cn.ts`.

## The flow — family-first, 4 numbered steps + welcome + submitted
A wizard sharing state across steps. Screens map 1:1 to the Figma files above.
1. **`/` = Welcome** (Mobile 1): FGA / PARENTS DAY 2026 header, `TracedScript` "Love Revealed",
   tagline, primary **BEGIN** → Step 1, secondary "Already have a family code?" → Join, "Takes about 1 minute".
2. **Step 1 of 4 — Create or Join Family** (Mobile 2 → 3/4): two cards CREATE / JOIN.
   Create (Mobile 3): family name → **Family Code** + a **join-QR** (`qrcode` is installed).
   Join (Mobile 4): enter or scan code, then **confirm** "You're joining The Tan Family".
   Back these with `app/api/family/create|join|[code]` route handlers using `getRepo()`.
3. **Step 2 of 4 — Profile + Selfie** (Mobile 5): FIRST NAME, YOUR ROLE chips, optional skippable
   selfie, and the consent checkbox "Show my first name, result, and photo on the event wall"
   (default **checked, non-blocking** — render per design, never gate on it). CONTINUE.
4. **Step 3 of 4 — Quiz** (Mobile 6/7): 5 questions, `QuizOption` default/selected, progress.
   Result computed **client-side** via `scoreQuiz`.
5. **Step 4 of 4 — Result** (Mobile 8): "YOUR LOVE LANGUAGE IS" + the result label rendered via
   **`displayLabel(style)`** (do NOT hardcode the Malaysian name or the English descriptor — always
   call `displayLabel`), icon, description (`lib/result-copy`), family-cluster preview.
6. **Submitted** (Mobile 9): "You're on the wall", submission-details card (name, `displayLabel`
   result, cluster viz), DONE. On entry, fire `lib/submit-client` (best-effort) to POST the submission.

## Wizard state
Extend/replace `lib/participant.ts`: participant id, family code + name, first name, role, selfie,
answers — persisted in `localStorage`, one participant per device.

## Constraints (STRICT)
- Root `/` MUST render Welcome. The design-system gallery stays at `/design-system` (do not touch it).
- Touch ONLY: `app/page.tsx`, `app/(experience)/**`, `app/api/family/**`, `components/quiz/**`,
  `components/family/**`, `lib/participant.ts`. Additive `app/globals.css` tweaks allowed if needed.
  Do NOT modify `components/ui/*`, `components/animation/*`, `lib/scoring*`, `lib/repo/*`,
  `lib/love-styles.ts`, `app/layout.tsx`, `package.json`.
- `bunx tsc --noEmit` green; smoke with `next dev` if useful. No full build, no format, no deps.
- Commit: `git add -A && git commit -m "feat(s10): mobile flow matching Figma — welcome@root, family-first 4-step + submitted"`.
