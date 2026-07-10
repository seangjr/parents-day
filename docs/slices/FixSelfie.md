# Fix — Selfie → Vercel Blob upload path (ADR-0001)

Isolated git worktree on branch `fix/selfie`. The `selfieUrl` field is plumbed end-to-end
(types → submit → LED `photoUrl`) but nothing ever uploads the captured photo: `selfie-field.tsx`
keeps a local `data:` URL and the submit payload omits `selfieUrl`. ADR-0001: "Optional selfies
stored in **private Vercel Blob**, referenced from the submission record."

## Build
- `app/api/upload/route.ts` (NEW): `POST` accepts the selfie image (data URL or Blob body),
  uploads to **private Vercel Blob** via `import { put } from "@vercel/blob"` (already installed),
  returns `{ url }`. **Graceful degrade:** if `process.env.BLOB_READ_WRITE_TOKEN` is unset, return
  `{ url: null }` (selfie is optional — never block submission).
- Wire the flow: when the participant has a captured selfie, upload it (call `/api/upload`) at
  submit time and put the returned URL into the submission's `selfieUrl`. If upload returns null
  or fails, submit with `selfieUrl: null` (best-effort, non-blocking — mirror `lib/submit-client.ts`).

## Constraints (STRICT)
- Touch ONLY: `app/api/upload/route.ts` (new), `components/quiz/selfie-field.tsx`,
  `components/quiz/submitted.tsx`, `lib/submit-client.ts`. Do NOT modify `package.json`
  (`@vercel/blob` is installed), `lib/repo/*`, `app/api/submit/route.ts` (it already accepts `selfieUrl`).
- `bunx tsc --noEmit` green. No full build, no format, no new deps.
- Commit: `git add -A && git commit -m "fix(selfie): upload to private Vercel Blob, graceful when unconfigured"`. One-line summary.
