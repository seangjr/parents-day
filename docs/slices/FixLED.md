# Fix — LED: honour removed items + fix Paused mode

Isolated git worktree on branch `fix/led`. Two confirmed code-review defects.

## Fix 1 — Admin "remove" must reach the LED (SPEC story 30)
`POST /api/admin/remove` records a hidden participant set (see `app/api/admin/store.ts`;
`app/api/admin/state/route.ts` already reads it as `removed.has(participantId)`). But
`app/api/led-state/route.ts` never consults it, so removed names still appear on the wall.
- In `app/api/led-state/route.ts`, read the same removed set (import the existing getter
  from `app/api/admin/store.ts`) and EXCLUDE removed `participantId`s from the response:
  the `newSubmissions`/log delta, the family member lists, AND the aggregate counts.

## Fix 2 — Paused mode must hold the wall, not show the join QR
`lib/led-orchestrator.ts` (~L353) maps BOTH `paused` and `welcome` admin modes to
`{ mode: "welcome" }` (idle join-QR). The admin hint for Paused is "Hold the wall".
- Make `paused` return a HOLD directive: keep the current mode/last frame (freeze), do
  not advance reveals and do not drop to welcome. Add/adjust the orchestrator unit test.

## Constraints (STRICT)
- Touch ONLY: `app/api/led-state/route.ts`, `lib/led-orchestrator.ts`, `lib/led-orchestrator.test.ts`.
  Read (don't restructure) `app/api/admin/store.ts` for the removed-set getter; if no getter is
  exported, add a small read-only one there and nothing else.
- `bunx tsc --noEmit` + `bun test lib/led-orchestrator.test.ts` green. No full build, no format, no new deps.
- Commit: `git add -A && git commit -m "fix(led): filter removed items + paused holds the wall"`. One-line summary.
