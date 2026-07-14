"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// TEMPORARY on-device motion diagnostic. Open /diag on the iPhone and screenshot
// the output. Delete this route once the mobile animation issue is resolved.
interface DiagResult {
  ua: string;
  iosVersion: string;
  reducedMotion: boolean;
  viewport: string;
  dpr: number;
  gsapType: string;
  gsapMoved: boolean;
  gsapTransform: string;
  rafFrames: number;
  cssMoved: boolean;
  errors: string[];
}

const IDENTITY = "matrix(1, 0, 0, 1, 0, 0)";

export default function DiagPage() {
  const gsapBox = useRef<HTMLDivElement>(null);
  const cssBox = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<DiagResult | null>(null);

  useEffect(() => {
    const errors: string[] = [];
    const onError = (event: ErrorEvent): void => {
      errors.push(`error: ${event.message}`);
    };
    const onReject = (event: PromiseRejectionEvent): void => {
      errors.push(`rejection: ${String(event.reason)}`);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);

    // 1) Raw requestAnimationFrame — is the frame loop even running?
    let rafFrames = 0;
    const step = (): void => {
      rafFrames += 1;
      if (rafFrames < 120) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    // 2) GSAP tween — does GSAP animate on this device?
    const gsapEl = gsapBox.current;
    if (gsapEl) gsap.to(gsapEl, { x: 180, duration: 0.9, ease: "none" });

    // 3) Pure CSS transition — independent of JS animation libs.
    const cssEl = cssBox.current;
    if (cssEl) {
      requestAnimationFrame(() => {
        cssEl.style.transform = "translateX(180px)";
      });
    }

    const timer = window.setTimeout(() => {
      const g = gsapBox.current;
      const c = cssBox.current;
      const gTransform = g ? getComputedStyle(g).transform : "none";
      const cTransform = c ? getComputedStyle(c).transform : "none";
      const ua = navigator.userAgent;
      const versionMatch = ua.match(/OS (\d+[_\d]*) like Mac OS X/);
      setResult({
        ua,
        iosVersion: versionMatch?.[1] ? versionMatch[1].replace(/_/g, ".") : "unknown",
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        dpr: window.devicePixelRatio,
        gsapType: typeof gsap,
        gsapMoved: gTransform !== "none" && gTransform !== IDENTITY,
        gsapTransform: gTransform,
        rafFrames,
        cssMoved: cTransform !== "none" && cTransform !== IDENTITY,
        errors,
      });
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: 16,
        background: "#111",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Motion diagnostic</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div ref={gsapBox} style={{ width: 40, height: 40, background: "#f0f4a6" }} />
        <div
          ref={cssBox}
          style={{
            width: 40,
            height: 40,
            background: "#ffdab9",
            transition: "transform 0.9s linear",
          }}
        />
      </div>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
        {result ? JSON.stringify(result, null, 2) : "running… (if this never changes, client JS/hydration is not running)"}
      </pre>
    </main>
  );
}
