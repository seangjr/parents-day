/**
 * Scoring engine — pure, deterministic, shared client + server (ADR-0003).
 *
 * Given the five forced-choice Quiz answers (A–E) it resolves a Participant's
 * Primary Love Style plus its display label, and — for a Family of N ≥ 2 — the
 * Family Love Mix counts and Family Archetype headline. Every rule here is
 * client-computable so results never depend on connectivity (ADR-0001).
 *
 * Only `primary` counts toward aggregation; hybrid / Rojak are display-only.
 */

import {
  LOVE_STYLES,
  LOVE_STYLE_ORDER,
  styleForAnswer,
  type LoveStyleId,
  type QuizAnswer,
  type Role,
} from "./love-styles";

/** Re-exported for scoring's callers; canonical definition lives in ./love-styles. */
export type { Role };

/** Result of scoring one Participant's five answers. */
export interface QuizResult {
  /** The single Primary Love Style (the only style that counts toward aggregates). */
  primary: LoveStyleId;
  /** The second tied style in a two-way tie, else null. */
  hybridWith: LoveStyleId | null;
  /** True when all five styles tie (Rojak Love). */
  isRojak: boolean;
  /** Human-readable label: "<Name>", "<Primary>, with a bit of <Other>", or "Rojak Love". */
  display: string;
  /** Per-style tallies (all five keys present, zeros included). */
  counts: Record<LoveStyleId, number>;
}

/** One Family member reduced to what the mix needs: their Primary Love Style and Role. */
export interface FamilyMember {
  primary: LoveStyleId;
  role: Role;
}

/** The headline label over a Family Love Mix (ADR-0003). */
export type FamilyArchetype = "dominant" | "contrast" | "rojak" | "twoway";

/** Result of mixing a Family's member Primary Love Styles (N ≥ 2). */
export interface FamilyMixResult {
  /** Per-style member tallies (all five keys present, zeros included). */
  counts: Record<LoveStyleId, number>;
  /** Number of distinct styles present. */
  distinct: number;
  /** The winning archetype (first match wins). */
  archetype: FamilyArchetype;
  /** Set only for the `dominant` archetype. */
  dominantStyle?: LoveStyleId;
  /** Set only for the `contrast` archetype. */
  contrast?: { parents: LoveStyleId; children: LoveStyleId };
  /** Human-readable headline over the mix. */
  headline: string;
}

/** A fresh per-style tally with every style initialised to zero. */
function emptyCounts(): Record<LoveStyleId, number> {
  const counts = {} as Record<LoveStyleId, number>;
  for (const id of LOVE_STYLE_ORDER) counts[id] = 0;
  return counts;
}

function nameOf(id: LoveStyleId): string {
  return LOVE_STYLES[id].name;
}

/**
 * The dominant style within a group of primaries, in join order.
 * Highest count wins; ties break to the earliest-joined member. Empty → undefined.
 */
function dominantOf(styles: LoveStyleId[]): LoveStyleId | undefined {
  if (styles.length === 0) return undefined;
  const counts = emptyCounts();
  for (const id of styles) counts[id] += 1;
  const max = Math.max(...LOVE_STYLE_ORDER.map((id) => counts[id]));
  const leaders = LOVE_STYLE_ORDER.filter((id) => counts[id] === max);
  // The earliest-joined member whose style is a leader breaks the tie.
  return styles.find((id) => leaders.includes(id));
}

/**
 * Score one Participant's forced-choice answers into a Primary Love Style.
 *
 * Each answer adds 1 to its style (A→sayang … E→hug). The top style is the
 * primary; a two-way tie (2+2+1) becomes a hybrid whose primary is the style
 * answered earliest; a five-way tie (1×5) is Rojak Love with its counted
 * primary being the earliest-answered style.
 */
export function scoreQuiz(answers: QuizAnswer[]): QuizResult {
  const chosen = answers
    .map((answer) => styleForAnswer(answer)?.id)
    .filter((id): id is LoveStyleId => id !== undefined);

  const counts = emptyCounts();
  for (const id of chosen) counts[id] += 1;

  const max = Math.max(0, ...LOVE_STYLE_ORDER.map((id) => counts[id]));
  const top = LOVE_STYLE_ORDER.filter((id) => counts[id] === max);
  // Primary is the tied top style answered earliest (first in `answers`).
  const primary = chosen.find((id) => top.includes(id)) ?? top[0];

  // Five-way (1×5) tie → Rojak. ≥3 co-leaders is unreachable with a 5-answer
  // quiz; it folds here as the honest "all mixed" result for robustness.
  if (top.length >= 3) {
    return { primary, hybridWith: null, isRojak: true, display: "Rojak Love", counts };
  }

  // Two-way tie (2+2+1) → "X, with a bit of Y", X = earliest-answered.
  if (top.length === 2) {
    const hybridWith = top[0] === primary ? top[1] : top[0];
    return {
      primary,
      hybridWith,
      isRojak: false,
      display: `${nameOf(primary)}, with a bit of ${nameOf(hybridWith)}`,
      counts,
    };
  }

  // Single top style.
  return { primary, hybridWith: null, isRojak: false, display: nameOf(primary), counts };
}

/**
 * Mix a Family's member Primary Love Styles into counts + an archetype (N ≥ 2).
 *
 * Only the `primary` of each member counts. The archetype is chosen first-match:
 *  1. dominant — one style is the strict max AND holds ≥ ceil(N/2) members.
 *  2. contrast — ≥1 parent-figure AND ≥1 child, and their group dominants differ.
 *  3. rojak    — ≥3 distinct styles present.
 *  4. twoway   — exactly two styles, tied (fallback).
 */
export function familyMix(members: FamilyMember[]): FamilyMixResult {
  const counts = emptyCounts();
  for (const member of members) counts[member.primary] += 1;

  const present = LOVE_STYLE_ORDER.filter((id) => counts[id] > 0);
  const distinct = present.length;
  const n = members.length;

  // 1. Dominant Family — one style holds the strict max and ≥ half the members.
  const max = Math.max(0, ...LOVE_STYLE_ORDER.map((id) => counts[id]));
  const leaders = LOVE_STYLE_ORDER.filter((id) => counts[id] === max);
  if (leaders.length === 1 && max > 0 && max >= Math.ceil(n / 2)) {
    const dominantStyle = leaders[0];
    return {
      counts,
      distinct,
      archetype: "dominant",
      dominantStyle,
      headline: `A ${nameOf(dominantStyle)} Family.`,
    };
  }

  // 2. Parent-Child Contrast — parent-figures and children lean different ways.
  const parentsDom = dominantOf(
    members
      .filter((m) => m.role === "parent" || m.role === "grandparent" || m.role === "guardian")
      .map((m) => m.primary),
  );
  const childrenDom = dominantOf(
    members.filter((m) => m.role === "child").map((m) => m.primary),
  );
  if (parentsDom !== undefined && childrenDom !== undefined && parentsDom !== childrenDom) {
    return {
      counts,
      distinct,
      archetype: "contrast",
      contrast: { parents: parentsDom, children: childrenDom },
      headline: `Parents lean ${nameOf(parentsDom)}; children lean ${nameOf(childrenDom)}.`,
    };
  }

  // 3. Rojak Love Family — three or more distinct styles.
  if (distinct >= 3) {
    return { counts, distinct, archetype: "rojak", headline: "A Rojak Love Family." };
  }

  // 4. Two-Way (fallback) — exactly two styles, tied.
  return {
    counts,
    distinct,
    archetype: "twoway",
    headline: `Loves in two ways: ${present.map(nameOf).join(" and ")}.`,
  };
}
