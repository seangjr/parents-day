"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  LOVE_STYLE_LIST,
  LOVE_STYLE_ORDER,
  type LoveStyleId,
} from "@/lib/love-styles";
import { FitText } from "@/components/fit-text";
import { SplitReveal } from "@/components/animation/split-reveal";
import { Odometer } from "@/components/animation/odometer";
import { TracedScript } from "@/components/animation/traced-script";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { Field } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QuizOption } from "@/components/ui/quiz-option";
import { Chip } from "@/components/ui/chip";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill } from "@/components/ui/pill";
import { LoveBadge } from "@/components/ui/love-badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatLabel } from "@/components/led/stat-label";
import { RevealCard } from "@/components/led/reveal-card";
import {
  FamilyConstellation,
  type FamilyMember,
} from "@/components/led/family-constellation";
import { CommunityDashboard } from "@/components/led/community-dashboard";
import { PhotoMoment } from "@/components/led/photo-moment";

const SWATCHES: { name: string; token: string; hex: string; cls: string }[] = [
  { name: "Deep Olive Black", token: "--color-olive-black", hex: "#10150F", cls: "bg-olive-black" },
  { name: "Shadow Black", token: "--color-shadow", hex: "#050705", cls: "bg-shadow" },
  { name: "Moss", token: "--color-moss", hex: "#3E4B2F", cls: "bg-moss" },
  { name: "Muted Olive", token: "--color-olive", hex: "#68734C", cls: "bg-olive" },
  { name: "Soft Sage", token: "--color-sage", hex: "#A8AD82", cls: "bg-sage" },
  { name: "Pale Lime", token: "--color-lime", hex: "#F0F4A6", cls: "bg-lime" },
  { name: "Warm Cream", token: "--color-cream", hex: "#F7F1C8", cls: "bg-cream" },
  { name: "Warm Beige", token: "--color-beige", hex: "#D2B48C", cls: "bg-beige" },
  { name: "Soft Peach", token: "--color-peach", hex: "#FFDAB9", cls: "bg-peach" },
];

const ROLES = ["Parent", "Child", "Grandparent", "Guardian", "Other"];

const SAMPLE_FAMILY: FamilyMember[] = [
  { name: "Mei", styleId: "sayang", role: "Parent" },
  { name: "Arif", styleId: "lepak", role: "Child" },
  { name: "Siti", styleId: "hug", role: "Grandparent" },
  { name: "Jun", styleId: "help", role: "Child" },
];

/** Consistent demo card. */
function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-sage/15 bg-shadow/40 p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A small caption above a demo. */
function Caption({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm text-sage/80">{children}</p>;
}

function Swatch({
  name,
  token,
  hex,
  cls,
}: {
  name: string;
  token: string;
  hex: string;
  cls: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("h-16 w-full rounded-xs border border-sage/15", cls)} />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-cream">{name}</span>
        <span className="font-mono text-xs text-sage">{hex}</span>
        <span className="font-mono text-xs text-sage/60">{token}</span>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [role, setRole] = useState("Parent");
  const [answer, setAnswer] = useState<string | null>("B");
  const [selfie, setSelfie] = useState(true);
  const [step, setStep] = useState(3);
  const [slide, setSlide] = useState(false);
  const [replay, setReplay] = useState(0);
  const [bigNumber, setBigNumber] = useState(1280);
  const [counts, setCounts] = useState<Record<LoveStyleId, number>>({
    sayang: 8,
    lepak: 5,
    help: 6,
    tapau: 3,
    hug: 4,
  });

  // Live community numbers: nudge a random style up on a steady cadence.
  useEffect(() => {
    const id = setInterval(() => {
      setCounts((current) => {
        const pick =
          LOVE_STYLE_ORDER[Math.floor(Math.random() * LOVE_STYLE_ORDER.length)];
        return { ...current, [pick]: current[pick] + 1 };
      });
    }, 1600);
    return () => clearInterval(id);
  }, []);

  // A more dramatic odometer that swings multiple digits.
  useEffect(() => {
    const id = setInterval(() => {
      setBigNumber(Math.floor(Math.random() * 4000));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const total = LOVE_STYLE_ORDER.reduce((sum, id) => sum + counts[id], 0);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-6 pb-16 pt-24">
      {/* ---- Header ---------------------------------------------------- */}
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="font-condensed text-sm font-bold uppercase tracking-[0.3em] text-lime">
            Love Revealed
          </span>
          <TextLink href="/">← Back to landing</TextLink>
        </div>
        <TracedScript className="h-24 text-cream sm:h-28" replayKey={replay} />
        <SplitReveal
          as="h1"
          reveal="chars"
          className="font-condensed text-5xl font-bold uppercase tracking-wide text-cream sm:text-7xl"
        >
          Design System
        </SplitReveal>
        <p className="max-w-2xl text-lg text-sage">
          The component kit, tokens, and signature motion for the Parents Day
          foyer experience. Everything scales fluidly (Osmo scaling) and rides
          the shared <code className="text-lime">--ease-smooth</code> easing.
        </p>
      </header>

      {/* ---- Tokens: colour ------------------------------------------- */}
      <section className="flex flex-col gap-6">
        <SectionHeading number={1} title="Palette" />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {SWATCHES.map((s) => (
            <Swatch key={s.token} {...s} />
          ))}
        </div>
      </section>

      {/* ---- Tokens: type, radii, shadow, easing ---------------------- */}
      <section className="flex flex-col gap-6">
        <SectionHeading number={2} title="Type & tokens" />
        <div className="grid gap-6 md:grid-cols-2">
          <Panel>
            <Caption>Oooh Baby — display script (font-display)</Caption>
            <p className="font-display text-6xl text-cream">Love Revealed</p>
          </Panel>
          <Panel>
            <Caption>Big Shoulders — condensed headings (font-condensed)</Caption>
            <p className="font-condensed text-5xl font-bold uppercase tracking-wide text-cream">
              Family Love Mix
            </p>
          </Panel>
          <Panel>
            <Caption>Geist — body (font-body)</Caption>
            <p className="text-base text-cream/90">
              Answer five quick questions and discover how you and your family
              give and receive love. Large tap targets, minimal typing, built
              for weak foyer wifi.
            </p>
          </Panel>
          <Panel className="flex flex-col gap-5">
            <div>
              <Caption>Radii — rounded-xs / rounded-card</Caption>
              <div className="flex items-end gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="size-16 rounded-xs bg-moss" />
                  <span className="font-mono text-xs text-sage">xs</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="size-16 rounded-card bg-moss" />
                  <span className="font-mono text-xs text-sage">card</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="size-16 rounded-xs bg-moss shadow-glow" />
                  <span className="font-mono text-xs text-sage">glow</span>
                </div>
              </div>
            </div>
            <div>
              <Caption>Signature easing — --ease-smooth</Caption>
              <div className="relative h-8 w-full rounded-full bg-moss/40">
                <div
                  className="absolute top-0 size-8 rounded-full bg-lime shadow-glow transition-[left] duration-700 ease-smooth"
                  style={{ left: slide ? "calc(100% - 2rem)" : "0px" }}
                />
              </div>
              <Button
                variant="text"
                className="mt-3"
                onClick={() => setSlide((s) => !s)}
              >
                Toggle motion →
              </Button>
            </div>
          </Panel>
        </div>
      </section>

      {/* ---- Primitives ----------------------------------------------- */}
      <section className="flex flex-col gap-6">
        <SectionHeading number={3} title="Primitives" />
        <div className="grid gap-6 md:grid-cols-2">
          <Panel>
            <Caption>Buttons — primary, ghost, disabled</Caption>
            <div className="flex flex-wrap items-center gap-3">
              <Button sparkle>Start Quiz</Button>
              <Button variant="ghost">Invite Family</Button>
              <Button disabled>Submitting…</Button>
              <Button variant="ghost" disabled>
                Disabled
              </Button>
            </div>
          </Panel>

          <Panel>
            <Caption>Text link</Caption>
            <p className="text-cream">
              Already answered?{" "}
              <TextLink href="#">See your result on the wall</TextLink>.
            </p>
          </Panel>

          <Panel>
            <Caption>Field — labelled input, hint &amp; error</Caption>
            <div className="flex flex-col gap-4">
              <Field label="First name" placeholder="e.g. Mei" hint="Just your first name is enough." />
              <Field
                label="Family Code"
                placeholder="TAN-K7"
                defaultValue="TAN-0"
                error="That code doesn't match a family."
              />
            </div>
          </Panel>

          <Panel>
            <Caption>Progress bar</Caption>
            <ProgressBar value={step} max={5} showLabel />
            <div className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                −
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.min(5, s + 1))}
              >
                +
              </Button>
            </div>
          </Panel>

          <Panel className="md:col-span-2">
            <Caption>Quiz option — default / selected + glow</Caption>
            <div className="flex flex-col gap-3">
              {LOVE_STYLE_LIST.map((meta) => (
                <QuizOption
                  key={meta.id}
                  letter={meta.answer}
                  selected={answer === meta.answer}
                  onClick={() => setAnswer(meta.answer)}
                >
                  {meta.name}
                  <span className="text-sage"> — {meta.descriptor}</span>
                </QuizOption>
              ))}
            </div>
          </Panel>

          <Panel>
            <Caption>Chips — selectable (role)</Caption>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Chip
                  key={r}
                  selected={role === r}
                  onClick={() => setRole(r)}
                >
                  {r}
                </Chip>
              ))}
            </div>
          </Panel>

          <Panel>
            <Caption>Checkbox &amp; pills</Caption>
            <div className="flex flex-col gap-4">
              <Checkbox
                label="Add a selfie (optional)"
                checked={selfie}
                onChange={(e) => setSelfie(e.target.checked)}
              />
              <div className="flex flex-wrap gap-2">
                <Pill>Default</Pill>
                {LOVE_STYLE_LIST.map((meta) => (
                  <Pill key={meta.id} tint={meta.hex}>
                    {meta.descriptor}
                  </Pill>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </section>

      {/* ---- Love badges ---------------------------------------------- */}
      <section className="flex flex-col gap-6">
        <SectionHeading number={4} title="Love Styles" />
        <div className="grid gap-5 sm:grid-cols-2">
          {LOVE_STYLE_ORDER.map((id) => (
            <Panel key={id}>
              <LoveBadge styleId={id} />
            </Panel>
          ))}
        </div>
      </section>

      {/* ---- Animations ----------------------------------------------- */}
      <section className="flex flex-col gap-6">
        <SectionHeading number={5} title="Motion" />
        <Button variant="ghost" onClick={() => setReplay((r) => r + 1)}>
          Replay animations
        </Button>

        <Panel>
          <Caption>Osmo fit-text — single line fills its container width</Caption>
          <FitText
            lineClassName="font-condensed font-bold uppercase tracking-wide text-cream"
            className="text-lime"
          >
            Reveal how your family loves
          </FitText>
        </Panel>

        <div className="grid gap-6 md:grid-cols-3">
          <Panel key={`lines-${replay}`}>
            <Caption>Split reveal — lines</Caption>
            <SplitReveal
              reveal="lines"
              className="font-condensed text-2xl font-bold uppercase tracking-wide text-cream"
            >
              Sayang words
              <br />
              carry far
            </SplitReveal>
          </Panel>
          <Panel key={`words-${replay}`}>
            <Caption>Split reveal — words</Caption>
            <SplitReveal
              reveal="words"
              className="font-condensed text-2xl font-bold uppercase tracking-wide text-cream"
            >
              Lepak love is quality time
            </SplitReveal>
          </Panel>
          <Panel key={`chars-${replay}`}>
            <Caption>Split reveal — chars</Caption>
            <SplitReveal
              reveal="chars"
              className="font-condensed text-2xl font-bold uppercase tracking-wide text-cream"
            >
              Rojak Love
            </SplitReveal>
          </Panel>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel className="flex flex-col items-start gap-3">
            <Caption>Number odometer — live &amp; fluctuating</Caption>
            <div className="flex items-baseline gap-3">
              <Odometer
                value={bigNumber}
                className="font-condensed text-6xl font-bold text-lime"
              />
              <span className="text-sage">people reached</span>
            </div>
            <StatLabel
              label="Just joined"
              value={<Odometer value={total} />}
              accent="#F0F4A6"
            />
          </Panel>
          <Panel className="flex flex-col items-center justify-center gap-3">
            <Caption>Traced script — draw-on wordmark (build-time path)</Caption>
            <TracedScript className="h-20 text-lime" replayKey={replay} />
          </Panel>
        </div>
      </section>

      {/* ---- LED components ------------------------------------------- */}
      <section className="flex flex-col gap-6">
        <SectionHeading number={6} title="LED wall" />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Caption>Individual Reveal</Caption>
            <RevealCard name="Mei" role="Parent" styleId="sayang" />
          </div>
          <div className="flex flex-col gap-3">
            <Caption>Photo Moment</Caption>
            <PhotoMoment
              familyName="The Tan Family"
              archetype="Rojak Love Family"
              members={SAMPLE_FAMILY}
            />
          </div>
        </div>

        <Panel>
          <Caption>Family Reveal — constellation</Caption>
          <FamilyConstellation
            familyName="The Tan Family"
            members={SAMPLE_FAMILY}
          />
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <Caption>Community Dashboard — live rolling counts</Caption>
            <StatLabel label="Total" value={<Odometer value={total} />} />
          </div>
          <CommunityDashboard counts={counts} />
        </Panel>
      </section>

      <footer className="border-t border-sage/15 pt-8 text-sm text-sage/70">
        Love Revealed — Parents Day 2026 · design-system reference
      </footer>
    </main>
  );
}
