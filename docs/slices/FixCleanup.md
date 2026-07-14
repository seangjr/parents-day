# Fix — displayLabel bypass, glossary, proxy fail-closed

Isolated git worktree on branch `fix/cleanup`. Small, targeted fixes from the code review.

## Fixes
1. **`displayLabel()` bypass** — these render the Malaysian name directly, so the
   `RESULT_LABEL` toggle (`lib/love-styles.ts`) can't switch them. Replace `meta.name` /
   `LOVE_STYLES[id].name` with `displayLabel(meta)` / `displayLabel(LOVE_STYLES[id])`:
   - `app/admin/admin-client.tsx` (~L191, ~L286)
   - `components/led/community-dashboard.tsx` (~L45)
   - `components/led/reveal-card.tsx` (~L75)
2. **Glossary** — `components/family/choose-family.tsx`: "family group" → "Family"
   (CONTEXT.md `_Avoid_: Family group`). Fix both occurrences in the copy.
3. **`proxy.ts` fail-closed in production** — when `process.env.NODE_ENV === "production"` AND
   `ADMIN_PIN` is unset or malformed, deny with the 401 PIN gate rather than opening. Keep dev
   fail-open only when the PIN is entirely unset in non-production.

## DO NOT TOUCH
- `app/diag/` and the `dangerouslySetInnerHTML` blocks in `app/page.tsx` / `app/(experience)/layout.tsx`
  are the user's TEMP mobile-debugging scaffolding (see layout.tsx comment). Leave them entirely alone.

## Constraints (STRICT)
- Touch ONLY: `app/admin/admin-client.tsx`, `components/led/community-dashboard.tsx`,
  `components/led/reveal-card.tsx`, `components/family/choose-family.tsx`, `proxy.ts`.
  Do NOT modify `app/diag`, `app/page.tsx`, `app/(experience)/layout.tsx`, `lib/*`, or `package.json`.
- `bunx tsc --noEmit` green. No full build, no format, no new deps.
- Commit: `git add -A && git commit -m "fix(cleanup): displayLabel surfaces, glossary, proxy fail-closed"`. One-line summary.
