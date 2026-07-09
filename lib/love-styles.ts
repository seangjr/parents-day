import {
  MessageSquare,
  Orbit,
  HandHelping,
  Star,
  Heart,
  type LucideIcon,
} from "lucide-react";

/**
 * The five canonical Love Styles.
 * Ties the domain vocabulary (CONTEXT.md / ADR-0003) to the design-system
 * visual identity (Figma "Love Language Visual System").
 */
export type LoveStyleId = "sayang" | "lepak" | "help" | "tapau" | "hug";

export type QuizAnswer = "A" | "B" | "C" | "D" | "E";

export interface LoveStyleMeta {
  id: LoveStyleId;
  /** Domain label — the canonical result name (ADR-0003). */
  name: string;
  /** Design-system descriptor (Figma visual system). */
  descriptor: string;
  /** Quiz answer letter this style maps to. */
  answer: QuizAnswer;
  /** Lucide icon used across the experience. */
  icon: LucideIcon;
  /** Accent color as a hex value (for dynamic inline styling). */
  hex: string;
  /** Design-system token name for the accent. */
  token: string;
  /** Human-readable color name. */
  colorName: string;
}

export const LOVE_STYLES: Record<LoveStyleId, LoveStyleMeta> = {
  sayang: {
    id: "sayang",
    name: "Sayang Words",
    descriptor: "Encouraging Words",
    answer: "A",
    icon: MessageSquare,
    hex: "#F7F1C8",
    token: "--color-cream",
    colorName: "Warm Cream",
  },
  lepak: {
    id: "lepak",
    name: "Lepak Love",
    descriptor: "Quality Time",
    answer: "B",
    icon: Orbit,
    hex: "#A8AD82",
    token: "--color-sage",
    colorName: "Soft Sage Green",
  },
  help: {
    id: "help",
    name: "Help-Help Love",
    descriptor: "Helpful Actions",
    answer: "C",
    icon: HandHelping,
    hex: "#68734C",
    token: "--color-olive",
    colorName: "Muted Olive",
  },
  tapau: {
    id: "tapau",
    name: "Tapau Love",
    descriptor: "Thoughtful Gifts",
    answer: "D",
    icon: Star,
    hex: "#D2B48C",
    token: "--color-beige",
    colorName: "Warm Beige",
  },
  hug: {
    id: "hug",
    name: "Warm Hug Love",
    descriptor: "Warm Affection",
    answer: "E",
    icon: Heart,
    hex: "#FFDAB9",
    token: "--color-peach",
    colorName: "Soft Peach Cream",
  },
};

/** Canonical display order (matches answer letters A–E). */
export const LOVE_STYLE_ORDER: LoveStyleId[] = [
  "sayang",
  "lepak",
  "help",
  "tapau",
  "hug",
];

export const LOVE_STYLE_LIST: LoveStyleMeta[] = LOVE_STYLE_ORDER.map(
  (id) => LOVE_STYLES[id],
);

/** Resolve a quiz answer letter to its Love Style. */
export function styleForAnswer(answer: string): LoveStyleMeta | undefined {
  return LOVE_STYLE_LIST.find((s) => s.answer === answer);
}
