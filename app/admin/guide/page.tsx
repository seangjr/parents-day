import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Staff Guide — Love Revealed",
};

/**
 * Staff-facing run-book for the foyer experience. Lives under /admin so it
 * inherits the six-digit PIN gate (proxy.ts, ADR-0006) — same credential staff
 * already use for the Console and the Wall. Self-contained: brand tokens only,
 * no app components, so it stays readable regardless of the rest of the build.
 */
export default function StaffGuidePage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-14 text-cream">
      <header className="border-b border-moss pb-6">
        <p className="font-condensed text-sm uppercase tracking-widest text-lime">
          Parents Day 2026 · Staff Guide
        </p>
        <h1 className="mt-2 font-condensed text-4xl font-bold uppercase tracking-wide sm:text-5xl">
          Running “Love&nbsp;Revealed”
        </h1>
        <p className="mt-3 leading-relaxed text-sage">
          A one-minute overview for anyone helping at the foyer. Guests scan a QR,
          answer 5 quick questions, discover their Malaysian “love style,” and
          appear together with their family on the big screen.
        </p>
      </header>

      <Section title="The two screens you run">
        <Item label="The Wall — /led">
          The big foyer display: the join QR, live counts, and family reveals.
          Open it once on the screen driving the display and leave it running
          fullscreen.
        </Item>
        <Item label="The Console — /admin">
          Your control panel (phone or laptop). Switches what the Wall shows and
          manages the event.
        </Item>
        <p className="mt-4 text-sm text-sage">
          Both ask for the{" "}
          <strong className="font-semibold text-cream">6-digit event PIN</strong>{" "}
          the first time on each device — enter it once and you’re set for the day.
        </p>
      </Section>

      <Section title="Setup (once, before doors open)">
        <ol className="flex flex-col gap-3">
          <Step n={1}>
            On the display device, open <Code>/led</Code>, enter the PIN, and go
            fullscreen. Leave it on <strong className="text-cream">Welcome</strong>{" "}
            so guests can start scanning.
          </Step>
          <Step n={2}>
            On your own device, open <Code>/admin</Code> and enter the same PIN.
          </Step>
          <Step n={3}>
            When you’re ready for reveals, set the Console’s LED Mode to{" "}
            <strong className="text-lime">Live</strong>.
          </Step>
        </ol>
      </Section>

      <Section title="Helping a guest (the 60-second flow)">
        <ol className="flex flex-col gap-3">
          <Step n={1}>
            Point them at the QR on the Wall (or a printed QR). It opens on their
            phone — no app to install.
          </Step>
          <Step n={2}>
            The <strong className="text-cream">first family member</strong> taps{" "}
            <strong className="text-lime">Create</strong>, types their family’s last
            name, and gets a <strong className="text-cream">Family Code</strong>{" "}
            (e.g. <Code>TAN-PE</Code>).
          </Step>
          <Step n={3}>
            Everyone else taps <strong className="text-lime">Join</strong> and enters
            that same code, so the family’s results group together on the Wall.
          </Step>
          <Step n={4}>
            Enter first name + role, add a selfie (optional), then answer the 5 quick
            questions.
          </Step>
          <Step n={5}>
            They see their love style, then tap{" "}
            <strong className="text-lime">Reveal on Wall</strong> — they appear on the
            big screen with their family.
          </Step>
        </ol>
        <Callout>
          One phone = one person. Each family member uses their own phone; they link
          up by sharing the Family Code.
        </Callout>
      </Section>

      <Section title="Controlling the Wall (Console → LED Mode)">
        <div className="flex flex-col divide-y divide-moss/60">
          <Mode name="Welcome">
            Idle join screen (just the QR). Use before doors open or between waves.
          </Mode>
          <Mode name="Live">
            The default. Reveals and the community dashboard cycle automatically.
          </Mode>
          <Mode name="Photo Moment">
            Spotlights the biggest family full-screen — great for a group photo.
          </Mode>
          <Mode name="Love Mix">
            Holds “Today’s Love Mix” — the room’s live love-language totals —
            until you switch back to Live.
          </Mode>
          <Mode name="Paused">
            Freezes the Wall on the current screen — use during an announcement.
          </Mode>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-sage">
          <strong className="text-cream">Remove</strong> hides a single entry from
          the Wall if needed. <strong className="text-cream">Reset all data</strong>{" "}
          wipes everything — only use it to start a completely fresh session, it
          can’t be undone.
        </p>
      </Section>

      <Section title="If something looks off">
        <div className="flex flex-col gap-4">
          <Trouble q="A guest’s screen is blank or won’t animate">
            Ask them to refresh the page. On iPhone, turning{" "}
            <strong className="text-cream">Low Power Mode off</strong> clears most
            animation issues.
          </Trouble>
          <Trouble q="The Wall isn’t updating">
            It refreshes every couple of seconds — give it a moment. If it’s stuck,
            check the display device’s internet and reload <Code>/led</Code>.
          </Trouble>
          <Trouble q="“Family not found” when joining">
            Re-check the code — it isn’t case-sensitive and looks like{" "}
            <Code>ABC-12</Code>. The person who created the family can re-share it.
          </Trouble>
          <Trouble q="It asks for the PIN again">
            Just re-enter the 6-digit event PIN. It resets after 12 hours or on a new
            device/browser.
          </Trouble>
        </div>
      </Section>

      <footer className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-moss pt-6 text-sm text-sage">
        <span>
          The Wall: <Code>/led</Code>
        </span>
        <span>
          The Console: <Code>/admin</Code>
        </span>
        <span>Family code format: ABC-12</span>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-condensed text-2xl font-bold uppercase tracking-wide text-cream">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 rounded-card border border-moss bg-shadow/50 p-4">
      <p className="font-condensed text-base font-bold uppercase tracking-wide text-lime">
        {label}
      </p>
      <p className="mt-1 leading-relaxed text-cream">{children}</p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-lime font-condensed text-sm font-bold text-lime">
        {n}
      </span>
      <span className="leading-relaxed text-cream">{children}</span>
    </li>
  );
}

function Mode({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
      <span className="font-condensed text-base font-bold uppercase tracking-wide text-lime sm:w-40 sm:shrink-0">
        {name}
      </span>
      <span className="leading-relaxed text-cream">{children}</span>
    </div>
  );
}

function Trouble({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-cream">{q}</p>
      <p className="mt-1 leading-relaxed text-sage">{children}</p>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-card border border-lime/30 bg-lime/5 p-4 leading-relaxed text-cream">
      {children}
    </p>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-shadow px-1.5 py-0.5 font-mono text-[0.9em] text-lime">
      {children}
    </code>
  );
}
