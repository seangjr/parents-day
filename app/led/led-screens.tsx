"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { LOVE_STYLES, LOVE_STYLE_LIST, type LoveStyleId } from "@/lib/love-styles";
import { Pill } from "@/components/ui/pill";
import { Odometer } from "@/components/animation/odometer";
import { StatLabel } from "@/components/led/stat-label";
import { RevealCard } from "@/components/led/reveal-card";
import { CommunityDashboard } from "@/components/led/community-dashboard";
import {
  FamilyConstellation,
  type FamilyMember,
} from "@/components/led/family-constellation";
import { PhotoMoment } from "@/components/led/photo-moment";
import { LedQr } from "./led-qr";
import type { LedDirective, LedFamily, LedFamilyMember } from "@/lib/led-orchestrator";

/** Map repo family members onto the constellation component's member shape. */
function constellationMembers(members: LedFamilyMember[]): FamilyMember[] {
  return members.map((m) => ({ name: m.firstName, styleId: m.primary, role: m.role }));
}

// ---------------------------------------------------------------------------
// Shared chrome — present on every LED screen (matches the Figma header + QR)
// ---------------------------------------------------------------------------

function BackgroundTextures() {
  // The Figma "background-textures" light rays, rebuilt from palette tokens
  // (no raw asset URLs): soft moss/olive glows over the deep olive-black.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-1/4 top-0 h-2/5 w-3/4 -rotate-6 bg-moss/25 blur-[120px]" />
      <div className="absolute -right-1/4 bottom-0 h-2/5 w-4/5 rotate-3 bg-olive/20 blur-[140px]" />
      <div className="absolute left-1/2 top-1/2 size-3/5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/10 blur-[160px]" />
    </div>
  );
}

function Header() {
  return (
    <header className="absolute left-0 top-0 z-10 flex flex-col gap-3 pl-[5%] pt-[5%]">
      <div className="flex items-center gap-3">
        <Heart className="size-5 text-lime" aria-hidden />
        <span className="font-condensed text-lg font-bold uppercase tracking-[0.2em] text-lime">
          Parents Day 2026
        </span>
      </div>
      <span className="font-display text-7xl leading-none text-lime">Love Revealed</span>
    </header>
  );
}

function QrCallout() {
  return (
    <div className="absolute bottom-[5%] right-[4%] z-10 flex flex-col items-center gap-4">
      <LedQr pixels={320} className="size-52 p-3" />
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-condensed text-xl font-bold uppercase tracking-wide text-lime">
          Scan to join the wall
        </span>
        <span className="text-base text-cream/70">
          Take the quiz. Find your family cluster.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/** LED 1/2 ambient wall — families as constellations. `dim` sinks it behind a reveal. */
function FamilyWall({ families, dim }: { families: LedFamily[]; dim?: boolean }) {
  const shown = families.slice(0, 8);
  return (
    <div
      aria-hidden={dim}
      className={cn(
        "absolute inset-0 flex flex-wrap content-center items-center justify-center gap-x-16 gap-y-4 px-[8%] py-[10%]",
        dim && "opacity-20",
      )}
    >
      {shown.map((family) => (
        <div key={family.code} className="w-56 shrink-0">
          <FamilyConstellation
            familyName={family.name}
            members={constellationMembers(family.members)}
          />
        </div>
      ))}
    </div>
  );
}

/** A compact per-style member tally for a family mix (LED 4). */
function MixCounts({ counts }: { counts: Record<LoveStyleId, number> }) {
  return (
    <div className="flex items-center gap-5">
      {LOVE_STYLE_LIST.filter((meta) => counts[meta.id] > 0).map((meta) => {
        const Icon = meta.icon;
        return (
          <span
            key={meta.id}
            className="flex items-center gap-1.5 font-condensed text-xl font-bold"
            style={{ color: meta.hex }}
          >
            <Icon className="size-4" aria-hidden />
            {counts[meta.id]}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-mode bodies
// ---------------------------------------------------------------------------

function Body({ directive }: { directive: LedDirective }) {
  switch (directive.mode) {
    case "welcome":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
          <LedQr pixels={420} className="size-72 p-4 shadow-glow" />
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-condensed text-3xl font-bold uppercase tracking-wide text-lime">
              Scan to join the wall
            </span>
            <span className="text-lg text-cream/70">
              Take the quiz. Find your family cluster.
            </span>
          </div>
        </div>
      );

    case "cluster-wall":
      return (
        <>
          <FamilyWall families={directive.payload.families} />
          <div className="absolute bottom-[6%] left-[5%] z-10 flex gap-12">
            <StatLabel
              label="People joined"
              value={<Odometer value={directive.payload.total} />}
              accent="#f0f4a6"
            />
            <StatLabel
              label="Families on the wall"
              value={<Odometer value={directive.payload.families.length} />}
            />
          </div>
        </>
      );

    case "active-join": {
      const { reveal, families } = directive.payload;
      const meta = LOVE_STYLES[reveal.primary];
      const role = reveal.role.charAt(0).toUpperCase() + reveal.role.slice(1);
      return (
        <>
          <FamilyWall families={families} dim />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Pill tint="#f0f4a6" className="animate-rise">
              Just joined
            </Pill>
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-16 rounded-full blur-3xl"
                style={{ background: `radial-gradient(closest-side, ${meta.hex}33, transparent)` }}
              />
              <RevealCard
                name={reveal.firstName}
                role={role}
                styleId={reveal.primary}
                photoUrl={reveal.selfieUrl ?? undefined}
                className="relative w-[28rem]"
              />
            </div>
            {reveal.familyName ? (
              <span className="font-condensed text-lg font-bold uppercase tracking-wide text-sage">
                Joining {reveal.familyName}
              </span>
            ) : null}
          </div>
        </>
      );
    }

    case "family-mix": {
      const { family, families } = directive.payload;
      return (
        <>
          <FamilyWall families={families} dim />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <FamilyConstellation
              familyName={family.name}
              members={constellationMembers(family.members)}
              className="w-[34rem]"
            />
            {family.mix ? (
              <>
                <p className="max-w-3xl text-center font-display text-4xl leading-tight text-lime">
                  {family.mix.headline}
                </p>
                <MixCounts counts={family.mix.counts} />
              </>
            ) : null}
          </div>
        </>
      );
    }

    case "photo-moment": {
      const { family } = directive.payload;
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <PhotoMoment
            familyName={family.name}
            archetype={family.mix?.headline}
            members={constellationMembers(family.members)}
            className="w-[38rem]"
          />
        </div>
      );
    }

    case "stats":
      return (
        <div className="absolute left-[7%] top-1/2 flex w-[34rem] -translate-y-1/2 flex-col gap-8 rounded-[2rem] border border-lime/25 bg-shadow/80 p-12 backdrop-blur-xl">
          <p className="font-display text-6xl leading-none text-lime">Today&apos;s Love Mix</p>
          <CommunityDashboard counts={directive.payload.counts} />
          <div className="flex flex-col gap-3 border-t border-lime/25 pt-4">
            <span className="flex items-baseline gap-3">
              <Odometer
                value={directive.payload.total}
                className="font-condensed text-3xl font-bold text-lime"
              />
              <span className="font-condensed text-lg font-bold uppercase tracking-wide text-lime">
                people joined
              </span>
            </span>
            <span className="font-condensed text-lg font-medium uppercase tracking-wide text-sage">
              {directive.payload.familyCount} families connected
            </span>
          </div>
        </div>
      );

    case "montage":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
          <div className="flex items-baseline gap-4">
            <Odometer
              value={directive.payload.count}
              className="font-condensed text-8xl font-bold text-lime"
            />
            <span className="font-condensed text-3xl font-bold uppercase tracking-wide text-cream">
              people just joined
            </span>
          </div>
          <div className="flex max-w-4xl flex-wrap items-center justify-center gap-5">
            {directive.payload.faces.map((face, i) => {
              const meta = LOVE_STYLES[face.primary];
              const Icon = meta.icon;
              return (
                <span
                  key={face.participantId}
                  className="flex animate-rise flex-col items-center gap-2"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span
                    className="flex size-16 items-center justify-center rounded-full border"
                    style={{
                      color: meta.hex,
                      borderColor: `${meta.hex}80`,
                      backgroundColor: `${meta.hex}14`,
                      boxShadow: `0 0 1.5rem ${meta.hex}33`,
                    }}
                  >
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <span className="font-condensed text-sm font-bold uppercase tracking-wide text-cream">
                    {face.firstName}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

/**
 * The full-bleed kiosk LED wall. Renders the shared chrome (textures, header,
 * join QR) with the active mode's body, re-keyed on `directive.key` so entrance
 * animations replay per segment but update in place within one. Never blanks.
 */
export function LedStage({ directive }: { directive: LedDirective }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-olive-black font-body text-cream">
      <BackgroundTextures />
      <Header />
      <div key={directive.key} className="absolute inset-0">
        <Body directive={directive} />
      </div>
      {directive.mode === "welcome" ? null : <QrCallout />}
    </div>
  );
}
