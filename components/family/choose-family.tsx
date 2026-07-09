import { cn } from "@/lib/cn";
import { TransitionLink } from "@/components/transition";
import {
  BUTTON_BASE,
  BUTTON_VARIANTS,
  ButtonContent,
} from "@/components/ui/button";
import { WizardStep } from "@/components/quiz/wizard-step";

/**
 * Step 1 of 4 — Create or Join (Figma Mobile 2). The fork that opens the
 * family-first wizard: start a new Family (server mints a Code) or join an
 * existing one by Code. Both paths set the Family, then advance to Step 2.
 */
export function ChooseFamily() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <WizardStep step={1} label="Join your family" />

      <div className="flex flex-col gap-4">
        <h1 className="font-display text-5xl leading-tight text-lime">
          Create or join a family group
        </h1>
        <p className="leading-relaxed text-cream">
          Your results will be grouped together on the live wall.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <ChoiceCard
          title="Create a family"
          body="Start a new family group and get a code for others to join."
          action="Create"
          href="/family/create"
        />
        <ChoiceCard
          title="Join with code"
          body="Enter the code shared by someone in your family."
          action="Join"
          href="/family/join"
        />
      </div>
    </div>
  );
}

interface ChoiceCardProps {
  title: string;
  body: string;
  action: string;
  href: string;
}

function ChoiceCard({ title, body, action, href }: ChoiceCardProps) {
  return (
    <div className="flex flex-col gap-5 rounded-card border border-lime/40 bg-lime/10 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-2">
        <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-lime">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-sage">{body}</p>
      </div>
      <TransitionLink
        href={href}
        className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, "self-start")}
      >
        <ButtonContent>{action}</ButtonContent>
      </TransitionLink>
    </div>
  );
}
