"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useLenis } from "lenis/react";

/* ----------------------------------------------------------------------------
   Osmo "Draw SVG" page transition — adapted for Next.js App Router.

   The original resource ran on Barba.js (an MPA library that AJAX-swaps HTML).
   Barba can't drive Next's RSC router, so orchestration is rebuilt here:

     cover (GSAP)  ->  atomic route swap (View Transitions API)  ->  reveal (GSAP)

   The overlay is a persistent, opaque, full-screen SVG stroke. Because it fully
   covers the viewport during the swap and is captured in BOTH view-transition
   snapshots, the browser's default root cross-fade is suppressed in globals.css
   (`::view-transition-old/new(root) { animation: none }`) — the View Transition
   exists purely for atomic DOM-commit timing; GSAP does every visible frame.

   The SVG `<path>` and `data-transition-wrap` attribute are from the resource
   and are DOM-targeted by the animation — do not rename or restructure them.
---------------------------------------------------------------------------- */

type TransitionContextValue = {
  /** Animate out, swap to `href`, animate in. No-op mid-transition. */
  navigate: (href: string) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useTransitionRouter(): TransitionContextValue {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error(
      "useTransitionRouter must be used within <TransitionProvider>."
    );
  }
  return ctx;
}

// Exact path from the Osmo resource. Do not edit — it defines the wipe shape.
const TRANSITION_PATH =
  "M43 259C296 11.5688 994 -3 922.994 498.259C851.988 999.517 281.229 1004.28 123 767C-35.2287 529.721 179 259 472 259C765 259 792 498.259 659 654C526 809.741 319 755 285 669.001C251 583.001 299 452 496 452C693 452 876.073 639.171 935 937.001";

// Safety net: if the route never signals commit (VT skipped, prefetch miss,
// error boundary, etc.), reveal anyway so the overlay can never stick covering.
const COMMIT_TIMEOUT_MS = 2000;

type ViewTransition = { finished: Promise<void>; ready: Promise<void> };
type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => ViewTransition;
};

let pluginRegistered = false;

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Root Lenis instance (from <LenisProvider>), used to reset scroll while covered.
  const lenis = useLenis();
  const pathRef = useRef<SVGPathElement>(null);
  const animatingRef = useRef(false);
  // Resolver for "the pending route committed", consumed by the pathname effect.
  const commitRef = useRef<{ target: string; resolve: () => void } | null>(null);

  // Register DrawSVG once, on the client.
  useEffect(() => {
    if (!pluginRegistered) {
      gsap.registerPlugin(DrawSVGPlugin);
      pluginRegistered = true;
    }
  }, []);

  // When the URL reaches the pending target, release the waiting transition.
  useEffect(() => {
    const pending = commitRef.current;
    if (pending && pending.target === pathname) {
      commitRef.current = null;
      pending.resolve();
    }
  }, [pathname]);

  const playCover = useCallback(() => {
    const path = pathRef.current;
    if (!path) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.set(path, { strokeWidth: "5%", drawSVG: "0% 0%" });
      tl.to(path, { duration: 1, drawSVG: "0% 85%", ease: "power1.inOut" });
      tl.to(
        path,
        { strokeWidth: "30%", duration: 0.75, ease: "power1.inOut" },
        "<0.25"
      );
    });
  }, []);

  const playReveal = useCallback(() => {
    const path = pathRef.current;
    if (!path) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      // Overlay is fully covering; continue the draw off the opposite side.
      tl.set(path, { drawSVG: "0% 100%" }, 0);
      tl.to(
        path,
        {
          duration: 1.25,
          drawSVG: "100% 100%",
          strokeWidth: "5%",
          ease: "power1.inOut",
        },
        0
      );
      // Lift the new page's heading in, hidden behind the cover until revealed.
      const heading = document.querySelector<HTMLElement>("[data-page-root] h1");
      if (heading) {
        tl.set(heading, { autoAlpha: 0, yPercent: 25 }, 0);
        tl.to(
          heading,
          { autoAlpha: 1, yPercent: 0, ease: "expo.out", duration: 1 },
          0.75
        );
      }
    });
  }, []);

  // Atomically swap to `href`, resolving once the new route is on screen.
  const swap = useCallback(
    (href: string, target: string) => {
      const committed = new Promise<void>((resolve) => {
        let done = false;
        const settle = () => {
          if (done) return;
          done = true;
          if (commitRef.current?.target === target) commitRef.current = null;
          resolve();
        };
        commitRef.current = { target, resolve: settle };
        // Never let the overlay stick if the commit signal is missed.
        setTimeout(settle, COMMIT_TIMEOUT_MS);
      });

      const doc = document as DocumentWithVT;
      if (typeof doc.startViewTransition === "function") {
        const vt = doc.startViewTransition(() => {
          router.push(href);
          return committed;
        });
        // `.finished`/`.ready` reject when a VT is skipped — swallow and fall
        // back to the commit signal so reveal still runs.
        return vt.finished.catch(() => {}).then(() => committed);
      }

      router.push(href);
      return committed;
    },
    [router]
  );

  const navigate = useCallback(
    async (href: string) => {
      if (animatingRef.current) return;

      const target = new URL(href, window.location.href).pathname;
      // Same route (e.g. active nav item / logo): just push, no wipe. Skipping
      // the wipe here is critical — pathname won't change, so the commit signal
      // would never fire and the overlay would stick covering the screen.
      if (target === window.location.pathname) {
        router.push(href);
        return;
      }

      animatingRef.current = true;
      try {
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reducedMotion) {
          await swap(href, target);
          lenis?.scrollTo(0, { immediate: true });
          return;
        }

        await playCover();
        await swap(href, target);
        lenis?.scrollTo(0, { immediate: true });
        await playReveal();
      } finally {
        animatingRef.current = false;
      }
    },
    [lenis, playCover, playReveal, swap, router]
  );

  return (
    <TransitionContext.Provider value={{ navigate }}>
      <div data-page-root className="contents">
        {children}
      </div>
      <div data-transition-wrap className="transition" aria-hidden="true">
        <div className="transition__shape">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            viewBox="0 0 1000 1000"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            className="transition__svg"
          >
            <path
              ref={pathRef}
              d={TRANSITION_PATH}
              stroke="currentColor"
              strokeWidth="0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
