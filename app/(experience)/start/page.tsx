import { TracedScript } from "@/components/animation/traced-script";
import { ProfileForm } from "@/components/quiz/profile-form";

export default function StartPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-lime">
          Parents Day 2026
        </span>
        <TracedScript className="h-20 w-full text-cream" />
        <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-cream">
          Discover your Love Style
        </h1>
        <p className="text-sage">
          Five quick questions, about a minute. Your result appears right here on
          your phone — even on shaky foyer wifi.
        </p>
      </header>
      <ProfileForm />
    </div>
  );
}
