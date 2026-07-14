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

   Two modes:
   - Draw-SVG wipe (default): cover -> swap -> reveal, all GSAP.
   - Crossfade (Osmo "Cross Fade Page Transition"), used BETWEEN quiz-flow
     routes: no overlay — the VT old/new root snapshots overlap-fade via CSS
     in globals.css (`html.vt-crossfade`), and the incoming h1 rises in via
     GSAP on the live DOM (the "new" snapshot is a live capture).
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

// The participant quiz flow — navigation BETWEEN these routes crossfades
// (Osmo "Cross Fade Page Transition") instead of running the draw-SVG wipe.
const CROSSFADE_ROUTES: Record<string, true> = {
  "/profile": true,
  "/quiz": true,
  "/result": true,
  "/submitted": true,
};

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

  // Resolves once the router has committed `target`; shared by both modes.
  const waitForCommit = useCallback((target: string) => {
    return new Promise<void>((resolve) => {
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        if (commitRef.current?.target === target) commitRef.current = null;
        resolve();
      };
      commitRef.current = { target, resolve: settle };
      // Never let a transition stick if the commit signal is missed.
      setTimeout(settle, COMMIT_TIMEOUT_MS);
    });
  }, []);

  // Atomically swap to `href`, resolving once the new route is on screen.
  const swap = useCallback(
    (href: string, target: string) => {
      const committed = waitForCommit(target);

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
    [router, waitForCommit]
  );

  // The Osmo crossfade's detail touch: the incoming page's h1 rises in.
  // Timings from the resource: yPercent 25 -> 0, expo.out, 1s, 0.3s into
  // the enter fade.
  const playHeadingRise = useCallback(() => {
    const heading = document.querySelector<HTMLElement>("[data-page-root] h1");
    if (!heading) return;
    gsap.fromTo(
      heading,
      { autoAlpha: 0, yPercent: 25 },
      { autoAlpha: 1, yPercent: 0, ease: "expo.out", duration: 1, delay: 0.3 }
    );
  }, []);

  // Osmo "Cross Fade" — quiz-flow route swaps. With View Transitions the old
  // and new root snapshots overlap-fade (CSS in globals.css: out 0.5s while
  // in 0.75s); without VT support the App Router can't keep both pages
  // mounted, so the same fades run sequentially on the live page column.
  const crossfadeSwap = useCallback(
    async (href: string, target: string) => {
      const committed = waitForCommit(target);

      const doc = document as DocumentWithVT;
      if (typeof doc.startViewTransition === "function") {
        document.documentElement.classList.add("vt-crossfade");
        try {
          const vt = doc.startViewTransition(async () => {
            router.push(href);
            await committed;
            // Rendering is suppressed inside the update callback — reset
            // scroll and stage the h1 before the new snapshot is captured.
            lenis?.scrollTo(0, { immediate: true });
            playHeadingRise();
          });
          await vt.finished.catch(() => {});
          await committed;
        } finally {
          document.documentElement.classList.remove("vt-crossfade");
        }
        return;
      }

      const page = document.querySelector<HTMLElement>("[data-page-root] main");
      if (page) {
        await gsap.to(page, { autoAlpha: 0, ease: "power1.in", duration: 0.5 });
      }
      router.push(href);
      await committed;
      lenis?.scrollTo(0, { immediate: true });
      const nextPage = document.querySelector<HTMLElement>(
        "[data-page-root] main"
      );
      if (nextPage) {
        gsap.fromTo(
          nextPage,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            ease: "power1.inOut",
            duration: 0.75,
            clearProps: "opacity,visibility",
          }
        );
      }
      playHeadingRise();
    },
    [lenis, playHeadingRise, router, waitForCommit]
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

        // Inside the quiz flow, pages crossfade; everything else wipes.
        if (
          CROSSFADE_ROUTES[window.location.pathname] &&
          CROSSFADE_ROUTES[target]
        ) {
          await crossfadeSwap(href, target);
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
    [lenis, playCover, playReveal, swap, crossfadeSwap, router]
  );

  // App-wide: intercept clicks on internal links so every navigation runs the
  // transition — no special link component needed, just use `next/link` or <a>.
  // Capture phase runs before next/link's own handler; preventDefault makes Link
  // bow out (it early-returns on e.defaultPrevented) while we drive the swap.
  // Opt a link out with `data-no-transition`.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest("a");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        anchor.hasAttribute("data-no-transition") ||
        (anchor.getAttribute("target") ?? "_self") !== "_self" ||
        (anchor.getAttribute("rel") ?? "").split(/\s+/).includes("external")
      ) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href) return;
      const url = new URL(href, window.location.href);
      // Only same-origin route changes; leave external, hash, and query-only
      // navigation to the browser / Next (avoids a stuck overlay on same path).
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      event.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

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
