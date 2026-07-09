import { TransitionLink } from "@/components/transition";

// Demo route to exercise the Draw SVG page transition. Safe to delete — it also
// serves as the canonical usage example for <TransitionLink>.
export default function TransitionDemoOne() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8 text-center">
      <p className="font-condensed text-sm uppercase tracking-[0.3em] text-sage">
        Transition demo
      </p>
      <h1 className="font-display text-7xl text-lime">Page One</h1>
      <p className="max-w-md text-cream/70">
        Click below and the stroke draws across to cover the screen, the route
        swaps underneath, then it draws away to reveal Page Two.
      </p>
      <TransitionLink
        href="/transition-demo/two"
        className="rounded-xs border border-sage/40 px-6 py-3 font-condensed uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-shadow"
      >
        Go to Page Two &rarr;
      </TransitionLink>
      <TransitionLink
        href="/"
        className="text-sm text-sage underline-offset-4 hover:underline"
      >
        Back home
      </TransitionLink>
    </main>
  );
}
