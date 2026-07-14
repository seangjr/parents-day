import type { ReactNode } from "react";
import { ParticipantProvider } from "@/lib/participant";

/**
 * Shell for the participant flow (start → quiz → result). The provider lives
 * here so participant state survives navigation between the steps, and a mobile
 * column keeps everything within comfortable thumb reach.
 */
export default function ExperienceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ParticipantProvider>
        {/* TEMP debug: on-device error catcher. Renders a red bar with any JS /
            hydration error on ANY page (incl. home), even if hydration dies.
            Remove together with the /diag route once the mobile issue is fixed. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){function s(t){try{var e=document.getElementById("__diag_err");if(!e){e=document.createElement("div");e.id="__diag_err";e.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#7f1d1d;color:#fff;font:12px/1.4 monospace;padding:10px;white-space:pre-wrap;max-height:45vh;overflow:auto;border-top:2px solid #fca5a5";(document.body||document.documentElement).appendChild(e)}e.textContent+=t+"\\n"}catch(x){}}window.addEventListener("error",function(e){s("ERR: "+(e.message||(e.error&&e.error.message)||"unknown")+(e.filename?" @ "+e.filename+":"+e.lineno:""))});window.addEventListener("unhandledrejection",function(e){var r=e.reason;s("REJECT: "+(r&&(r.stack||r.message)?r.stack||r.message:String(r)))})})();',
          }}
        />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-8 pb-12 pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-moss/20 blur-3xl"
        />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </main>
    </ParticipantProvider>
  );
}
