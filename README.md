This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Run

Love Revealed — a QR-based foyer experience for Parents Day 2026. Three surfaces
share one Next.js app, one Upstash Redis store, and the shared scoring engine.

### Develop

```bash
bun install
bun dev            # http://localhost:3000
```

With no environment set, the app runs fully local: an in-memory repository
stands in for Redis and the shared-secret gate is open, so every surface is
reachable.

### Environment

Copy `.env.example` to `.env.local` for a real backend:

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis, the
  single source of truth. Absent ⇒ in-memory repo (dev only).
- `ADMIN_SECRET` — shared secret gating `/admin` and `/led`. Absent ⇒ gate open;
  production MUST set it.

### Surfaces

- **Participant — `/`**: scan → five-question quiz → on-device Love Style result
  → create/join a Family → live Family Love Mix.
- **LED — `/led`**: the foyer wall. Polls `/api/led-state` every ~1.5s and runs
  idle → individual reveals → family reveals → rolling community dashboard →
  photo moment. Holds the last frame and resyncs from the Redis cursor on a
  failed poll, so it never blanks.
- **Admin — `/admin`**: operator console. Set the LED mode, force a reveal,
  remove an item, reset all data. Gated by `ADMIN_SECRET` (append `?key=<secret>`
  once to mint the operator cookie).

### Deploy

Deploys to Vercel with the serverless region pinned to `sin1` (Singapore) via
`vercel.json`. Set the three env vars above in the Vercel project.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
