import { NextResponse, type NextRequest } from "next/server";

/**
 * Shared-secret gate (ADR-0006). Gates `/admin`, `/led`, and their APIs behind
 * a single `ADMIN_SECRET`; participant routes stay open. This is the Next 16
 * "Routing Middleware" — the `middleware` convention was deprecated and renamed
 * to `proxy` in v16, so the file lives at the project root as `proxy.ts`.
 *
 * Auth handshake: a valid `?key=<secret>` mints an httpOnly cookie and redirects
 * to a clean URL (keeping the secret out of history / referer); thereafter the
 * cookie carries the operator — and the LED kiosk's `/api/led-state` polls —
 * through. In development an unset `ADMIN_SECRET` leaves the gate open, matching
 * the repo's dev fallbacks (`getRepo` → in-memory, `led-state` → "live") so the
 * console is usable locally without config. In production an unset secret fails
 * CLOSED (denies): the Reset action is destructive, so a misconfigured deploy
 * must never expose the console.
 *
 * NOT Vercel Deployment Protection, which would also lock out participants
 * (ADR-0006): the gate is route-scoped in `config.matcher` by design.
 */

/** Cookie holding the shared secret once exchanged (httpOnly bearer). */
const COOKIE = "pd_admin";
/** Cookie lifetime — comfortably covers a single event day. */
const MAX_AGE = 60 * 60 * 12;

export function proxy(request: NextRequest): NextResponse {
  const secret = process.env.ADMIN_SECRET;

  // No secret configured: fail-OPEN in dev, and always for the read-only LED
  // wall — a missing secret must never blank the public projector. Fail-CLOSED
  // only for the destructive admin surface (/admin, /api/admin) in production,
  // where an unset ADMIN_SECRET must deny rather than expose Reset (ADR-0006).
  if (!secret) {
    const path = request.nextUrl.pathname;
    const isAdmin = path.startsWith("/admin") || path.startsWith("/api/admin");
    if (process.env.NODE_ENV === "production" && isAdmin) {
      return unauthorized(path);
    }
    return NextResponse.next();
  }

  const url = request.nextUrl;
  const cookie = request.cookies.get(COOKIE)?.value;
  const queryKey = url.searchParams.get("key");

  // Already authorised by cookie — just strip any lingering `key` from the URL.
  if (cookie === secret) {
    if (queryKey === null) return NextResponse.next();
    const clean = url.clone();
    clean.searchParams.delete("key");
    return NextResponse.redirect(clean);
  }

  // Valid key presented → set the cookie and bounce to the clean URL.
  if (queryKey === secret) {
    const clean = url.clone();
    clean.searchParams.delete("key");
    const res = NextResponse.redirect(clean);
    res.cookies.set(COOKIE, secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE,
    });
    return res;
  }

  // Unauthorised: APIs get a terse 401 JSON; pages get a minimal key form.
  return unauthorized(url.pathname);
}

/**
 * The unauthorised response: APIs get a terse 401 JSON; pages get a minimal
 * no-JS key form. Both carry 401 so callers can distinguish the gate.
 */
function unauthorized(pathname: string): NextResponse {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return new NextResponse(gateHtml(pathname), {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Escape a value for safe interpolation into an HTML attribute / body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A no-JS access-key page. Submitting the GET form appends `?key=…` to the
 * current path, which the proxy validates and exchanges for the cookie.
 */
function gateHtml(pathname: string): string {
  const action = escapeHtml(pathname);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Love Revealed — Staff access</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center;
    font-family: system-ui, sans-serif; background: #10150F; color: #F7F1C8; }
  form { display: flex; flex-direction: column; gap: 1rem; width: min(22rem, 90vw);
    padding: 2rem; border: 1px solid rgba(168,173,130,0.3); border-radius: 1rem;
    background: rgba(5,7,5,0.6); }
  h1 { margin: 0; font-size: 1rem; letter-spacing: 0.08em; text-transform: uppercase; color: #F0F4A6; }
  p { margin: 0; font-size: 0.875rem; color: #A8AD82; }
  input { padding: 0.75rem 1rem; border-radius: 0.375rem; border: 1px solid rgba(168,173,130,0.3);
    background: rgba(5,7,5,0.6); color: #F7F1C8; font-size: 1rem; }
  button { padding: 0.75rem 1rem; border-radius: 0.375rem; border: 0; cursor: pointer;
    background: #F0F4A6; color: #10150F; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
</style>
</head>
<body>
<form method="GET" action="${action}">
  <h1>Staff access</h1>
  <p>Enter the event access key to reach this screen.</p>
  <input type="password" name="key" placeholder="Access key" autofocus autocomplete="current-password" required />
  <button type="submit">Enter</button>
</form>
</body>
</html>`;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/led",
    "/led/:path*",
    "/api/admin/:path*",
    "/api/led-state",
    "/api/led-state/:path*",
  ],
};
