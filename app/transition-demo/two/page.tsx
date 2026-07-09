import { TransitionLink } from "@/components/transition";

// Demo route to exercise the Draw SVG page transition. Safe to delete.
export default function TransitionDemoTwo() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8 text-center">
      <p className="font-condensed text-sm uppercase tracking-[0.3em] text-sage">
        Transition demo
      </p>
      <h1 className="font-display text-7xl text-peach">Page Two</h1>
      <p className="max-w-md text-cream/70">
        The heading you just watched rise in is animated by the reveal timeline.
      </p>
      <TransitionLink
        href="/transition-demo"
        className="rounded-xs border border-sage/40 px-6 py-3 font-condensed uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-shadow"
      >
        &larr; Back to Page One
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
