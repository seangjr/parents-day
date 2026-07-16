import type { LoveStyleId } from "@/lib/love-styles";

/**
 * Warm, participant-facing copy for a Love Style result (SPEC copy direction).
 * The badge and headline come from the shared visual/scoring modules; this is
 * the human description shown underneath.
 */
export interface LoveStyleCopy {
  /** Short essence line shown under the badge. */
  tagline: string;
  /** One–two warm sentences describing the style. */
  description: string;
}

/** The five Love Style descriptions shown on the result screen. */
export const RESULT_COPY: Record<LoveStyleId, LoveStyleCopy> = {
  sayang: {
    tagline: "You love out loud.",
    description:
      "Encouraging Words are your way — a well-timed “I’m proud of you” from you can carry someone through their whole week.",
  },
  lepak: {
    tagline: "You love by showing up.",
    description:
      "Quality Time is unhurried togetherness. No agenda, no rush — just being there is your whole heart.",
  },
  help: {
    tagline: "You love with your hands.",
    description:
      "Helpful Actions spot what needs doing and quietly get it done, making life a little lighter for the people you love.",
  },
  tapau: {
    tagline: "You love in little parcels.",
    description:
      "Thoughtful Gifts are a favourite dish packed home or a small surprise — your way of saying “I was thinking of you.”",
  },
  hug: {
    tagline: "You love up close.",
    description:
      "Warm Touches are presence you can feel — a hug at the door, a hand held, sitting shoulder to shoulder.",
  },
};

/** Shown when all five answers differ — the all-mixed Rojak Love result. */
export const ROJAK_COPY: LoveStyleCopy = {
  tagline: "You love in every way.",
  description:
    "Rojak Love — a little of every love language: words, time, help, gifts and hugs, mixed together like the best rojak.",
};
