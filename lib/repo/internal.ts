import { LOVE_STYLE_ORDER, type LoveStyleId } from "@/lib/love-styles";

/** Family membership size cap (ADR-0002). */
export const MAX_FAMILY_SIZE = 10;

/** Confusion-safe letters for the code prefix — excludes I and O. */
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
/** Confusion-safe alphabet for the code suffix — letters plus digits, no 0/1. */
const CODE_ALPHABET = `${CODE_LETTERS}23456789`;
/** Leading articles dropped when deriving a prefix from a Family Name. */
const ARTICLES: Record<string, true> = { THE: true, A: true, AN: true };

function randomChar(alphabet: string): string {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

/**
 * Mint one confusion-safe Family Code candidate, e.g. `TAN-K7`. The prefix is
 * up to three safe letters derived from the Family Name (leading article
 * dropped), padded with random safe letters; the suffix is two chars from the
 * safe alphabet. Callers retry on collision to guarantee uniqueness.
 */
export function mintFamilyCode(name: string): string {
  const significant = name
    .toUpperCase()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !ARTICLES[word])
    .join("");
  const safeLetters = significant.replace(/[^A-Z]/g, "");

  let prefix = "";
  for (const char of safeLetters) {
    if (CODE_LETTERS.includes(char)) prefix += char;
    if (prefix.length === 3) break;
  }
  while (prefix.length < 3) prefix += randomChar(CODE_LETTERS);

  const suffix = `${randomChar(CODE_ALPHABET)}${randomChar(CODE_ALPHABET)}`;
  return `${prefix}-${suffix}`;
}

/** A fresh, fully-zeroed counter record across all Love Styles. */
export function zeroCounts(): Record<LoveStyleId, number> {
  const counts = {} as Record<LoveStyleId, number>;
  for (const id of LOVE_STYLE_ORDER) counts[id] = 0;
  return counts;
}
