import { cn } from "@/lib/cn";
import { FgaLogo } from "@/components/ui/fga-logo";
import { TracedScript } from "@/components/animation/traced-script";
import { TransitionLink, TransitionTextLink } from "@/components/transition";
import { BUTTON_BASE, BUTTON_VARIANTS, ButtonContent } from "@/components/ui/button";
import { SplitReveal } from "@/components/animation/split-reveal";
import Link from "next/link";
import { ParticipantReset } from "@/lib/participant";

/**
 * Welcome (Figma Mobile 1) — the QR landing. Brand lockup + the "Love Revealed"
 * script wordmark, a one-line tagline, then BEGIN into the family-first wizard
 * (Step 1). A returning member with a code jumps straight to Join. Reaching
 * this page always resets the stored Participant (<ParticipantReset />) so the
 * next person on a shared device starts blank. Replaces the old design-system
 * landing; the gallery still lives at /design-system.
 */
export default function Welcome() {
  return (
    <>
      <ParticipantReset />
            <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){function s(t){try{var e=document.getElementById("__diag_err");if(!e){e=document.createElement("div");e.id="__diag_err";e.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#7f1d1d;color:#fff;font:12px/1.4 monospace;padding:10px;white-space:pre-wrap;max-height:45vh;overflow:auto;border-top:2px solid #fca5a5";(document.body||document.documentElement).appendChild(e)}e.textContent+=t+"\\n"}catch(x){}}window.addEventListener("error",function(e){s("ERR: "+(e.message||(e.error&&e.error.message)||"unknown")+(e.filename?" @ "+e.filename+":"+e.lineno:""))});window.addEventListener("unhandledrejection",function(e){var r=e.reason;s("REJECT: "+(r&&(r.stack||r.message)?r.stack||r.message:String(r)))})})();',
          }}
        />
        <Link
          href="/"
          aria-label="FGA — Parents Day 2026 home"
          className="fixed left-6 top-6 z-50 flex flex-col items-center gap-2 transition-opacity hover:opacity-70 sm:left-8 sm:top-8"
        >
          <FgaLogo className="h-5 w-auto" />
          <span className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-lime">
            Parents Day 2026
          </span>
        </Link>

    <main className="relative flex min-h-dvh flex-col justify-between overflow-hidden px-8 pb-10 pt-24">
      
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/20 blur-3xl"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-12 text-center">
        {/* <div className="flex flex-col items-center gap-2">
          <FgaLogo className="h-5 w-auto text-lime" />
          <p className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-lime">
            Parents Day 2026
          </p>
        </div> */}

        <TracedScript className="h-40 w-full max-w-md text-lime sm:h-48" />

        <SplitReveal as="p" className="max-w-sm text-base leading-relaxed text-cream">
          Discover how you and your family give and receive love. Answer 5 quick
          questions and join the live family wall.
        </SplitReveal>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <TransitionLink
          href="/family"
          className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "w-full")}
        >
          <ButtonContent sparkle>Begin</ButtonContent>
        </TransitionLink>
        <TransitionTextLink href="/family/join">
          Already have a family code?
        </TransitionTextLink>
        <SplitReveal as="p" className="text-xs text-sage">Takes about 1 minute</SplitReveal>
      </div>
    </main>
    </>
  );
}
