import { NextResponse, type NextRequest } from "next/server";

/**
 * Six-digit event PIN gate (ADR-0006). Gates `/admin`, `/led`, and their APIs
 * behind one `ADMIN_PIN`; participant routes stay open. This is the Next 16
 * `proxy` convention at the project root.
 *
 * A valid form POST mints an httpOnly cookie and redirects with 303 to the
 * requested page. The PIN never enters the URL, browser history, or referrer.
 * Development remains open when `ADMIN_PIN` is unset; production fails closed
 * for every matched admin and LED surface.
 *
 * NOT Vercel Deployment Protection, which would also lock out participants
 * (ADR-0006): the gate is route-scoped in `config.matcher` by design.
 */

/** Cookie carrying the accepted event PIN for the duration of the event. */
const COOKIE = "pd_access";
const PIN_PATTERN = /^\d{6}$/;
/** Cookie lifetime — comfortably covers a single event day. */
const MAX_AGE = 60 * 60 * 12;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pin = process.env.ADMIN_PIN;
  const path = request.nextUrl.pathname;

  // Local development remains convenient without configuration. Production
  // denies every matched admin and LED surface when the PIN is missing.
  if (!pin) {
    if (process.env.NODE_ENV === "production") {
      return unauthorized(path);
    }
    return NextResponse.next();
  }

  // A configured credential that is not exactly six digits is a closed gate,
  // never an accidental bypass.
  if (!PIN_PATTERN.test(pin)) {
    return unauthorized(path);
  }

  const cookie = request.cookies.get(COOKIE)?.value;
  if (cookie === pin) {
    return NextResponse.next();
  }

  const isPagePinSubmission =
    request.method === "POST" && !path.startsWith("/api/");
  if (isPagePinSubmission) {
    let submittedPin: FormDataEntryValue | null = null;
    try {
      submittedPin = (await request.formData()).get("pin");
    } catch {
      // A malformed form is handled exactly like an incorrect PIN.
    }

    if (submittedPin === pin) {
      const response = NextResponse.redirect(request.nextUrl, 303);
      response.cookies.set(COOKIE, pin, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: MAX_AGE,
      });
      return response;
    }

    return unauthorized(path, true);
  }

  return unauthorized(path);
}

/**
 * APIs receive terse JSON; pages receive the no-JS PIN form. Both carry 401 so
 * callers can distinguish the gate from the protected route.
 */
function unauthorized(pathname: string, invalidPin = false): NextResponse {
  const securityHeaders = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: securityHeaders },
    );
  }

  return new NextResponse(gateHtml(pathname, invalidPin), {
    status: 401,
    headers: {
      ...securityHeaders,
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      "content-type": "text/html; charset=utf-8",
    },
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
 * No-JS PIN page. POST keeps the credential out of the URL and lets the proxy
 * exchange it directly for the protected cookie.
 */
function gateHtml(pathname: string, invalidPin: boolean): string {
  const action = escapeHtml(pathname);
  const error = invalidPin
    ? '<p class="error" id="pin-error" role="alert">That PIN didn’t match. Try again.</p>'
    : "";
  const describedBy = invalidPin ? "pin-help pin-error" : "pin-help";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Love Revealed — Staff access</title>
<style>
  @font-face { font-family: "Oooh Baby"; src: url("/fonts/OoohBaby-Regular.ttf") format("truetype"); font-display: swap; }
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 1.5rem;
    font-family: ui-sans-serif, system-ui, sans-serif; background:
      radial-gradient(circle at 18% 8%, rgba(104,115,76,.28), transparent 34rem),
      radial-gradient(circle at 82% 92%, rgba(62,75,47,.32), transparent 32rem), #10150F;
    color: #F7F1C8; -webkit-font-smoothing: antialiased; }
  main { width: min(25rem, 100%); }
  form { display: flex; flex-direction: column; gap: 1.25rem; padding: 2rem;
    border: 1px solid rgba(240,244,166,.2); border-radius: 1.5rem;
    background: rgba(5,7,5,.72); box-shadow: 0 1.5rem 5rem rgba(0,0,0,.38);
    backdrop-filter: blur(1rem); }
  header { display: flex; flex-direction: column; gap: .35rem; text-align: center; }
  .wordmark { margin: 0; font-family: "Oooh Baby", cursive; font-size: 3rem;
    font-weight: 400; line-height: 1; color: #F0F4A6; text-wrap: balance; }
  .eyebrow { margin: 0; font-size: .75rem; font-weight: 750; letter-spacing: .18em;
    text-transform: uppercase; color: #A8AD82; }
  .field { display: flex; flex-direction: column; gap: .65rem; }
  label { font-size: .8125rem; font-weight: 700; letter-spacing: .08em;
    text-align: center; text-transform: uppercase; color: #F7F1C8; }
  .hint { margin: 0; font-size: .8125rem; line-height: 1.5; text-align: center; color: #A8AD82; }
  .error { margin: 0; border-radius: .5rem; padding: .65rem .75rem;
    background: rgba(255,218,185,.1); color: #FFDAB9; font-size: .8125rem; text-align: center; }
  input { width: 100%; min-height: 4rem; padding: .7rem .8rem .7rem 1.15rem;
    border: 1px solid rgba(168,173,130,.42); border-radius: .75rem;
    background: rgba(16,21,15,.88); color: #F0F4A6; caret-color: #F0F4A6;
    font: 700 2rem/1 ui-monospace, monospace; font-variant-numeric: tabular-nums;
    letter-spacing: .38em; text-align: center; }
  input::placeholder { color: rgba(168,173,130,.38); }
  input:focus-visible { outline: 2px solid #F0F4A6; outline-offset: 3px; }
  input[aria-invalid="true"] { border-color: #FFDAB9; }
  button { min-height: 3rem; padding: .8rem 1rem; border: 0; border-radius: .75rem;
    cursor: pointer; background: #F0F4A6; color: #10150F; font-size: .875rem;
    font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
    transition: transform .18s ease, background-color .18s ease; }
  button:hover { background: #F7F1C8; }
  button:active { transform: scale(.96); }
  button:focus-visible { outline: 2px solid #F7F1C8; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) { button { transition: none; } }
</style>
</head>
<body>
<main>
  <form method="POST" action="${action}">
    <header>
      <p class="eyebrow">Parents Day 2026</p>
      <h1 class="wordmark">Love Revealed</h1>
    </header>
    <div class="field">
      <label for="pin">6-digit event PIN</label>
      <input id="pin" type="password" name="pin" inputmode="numeric" pattern="[0-9]{6}"
        minlength="6" maxlength="6" autocomplete="one-time-code" placeholder="••••••"
        aria-describedby="${describedBy}"${invalidPin ? ' aria-invalid="true"' : ""} autofocus required />
      <p class="hint" id="pin-help">Enter the staff PIN to open this screen.</p>
      ${error}
    </div>
    <button type="submit">Unlock screen</button>
  </form>
</main>
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
    "/api/led-background",
    "/api/led-background/:path*",
  ],
};
