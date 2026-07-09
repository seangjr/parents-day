import Link from "next/link";
import { cn } from "@/lib/cn";
import { BUTTON_BASE, BUTTON_VARIANTS } from "@/components/ui/button";
import { TracedScript } from "@/components/animation/traced-script";
import { SplitReveal } from "@/components/animation/split-reveal";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 overflow-hidden px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/20 blur-3xl"
      />
      <span className="relative font-condensed text-sm font-bold uppercase tracking-[0.3em] text-lime">
        Parents Day 2026
      </span>
      <TracedScript className="relative h-40 w-full max-w-3xl text-cream sm:h-56" />
      <SplitReveal
        as="p"
        reveal="words"
        className="relative max-w-xl text-lg text-sage sm:text-xl"
      >
        Discover how you and your family give and receive love — five quick
        questions, one Malaysian-inspired Love Style.
      </SplitReveal>
      <Link
        href="/design-system"
        className={cn("relative", BUTTON_BASE, BUTTON_VARIANTS.primary)}
      >
        Explore the design system
      </Link>
    </main>
  );
}
