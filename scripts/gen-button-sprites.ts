/**
 * Build-time generator for the stop-motion button sprites.
 *
 * Emits two horizontal sprite strips as STATIC SVG path data to
 * `lib/button-sprites.ts`:
 *   - BUTTON_BODY_SPRITE    — the hand-drawn wobbly button body (3 frames).
 *   - BUTTON_SPARKLE_SPRITE — a twinkling 4-point sparkle (4 frames).
 *
 * Each frame is drawn side by side in one viewBox; the button CSS clips to a
 * single frame and cycles through them with `steps()` on the X translate,
 * producing the "redrawn every frame" stop-motion look (see globals.css).
 * The jitter is seeded so the outline is reproducible but "boils" frame to
 * frame like a marker line that was traced three times.
 *
 * Run: `bun scripts/gen-button-sprites.ts`
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Decimal precision of the emitted path data (smaller = fewer bytes). */
const PRECISION = 2;
const r = (n: number) => Math.round(n * 10 ** PRECISION) / 10 ** PRECISION;

/** Small deterministic PRNG so regenerating yields identical geometry. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

/** Closed Catmull-Rom spline through ordered points → cubic-bezier path data. */
function closedSpline(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d + "Z";
}

/** Ordered perimeter samples of an axis-aligned rounded rectangle. */
function roundedRectPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rad: number,
): Pt[] {
  const pts: Pt[] = [];
  const push = (x: number, y: number) => pts.push([x, y]);
  const arc = (cx: number, cy: number, a0: number, a1: number, steps: number) => {
    for (let s = 1; s < steps; s++) {
      const a = a0 + (a1 - a0) * (s / steps);
      push(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
  };
  const H = Math.PI / 2;
  push(x0 + rad, y0);
  push((x0 + x1) / 2, y0);
  push(x1 - rad, y0);
  arc(x1 - rad, y0 + rad, -H, 0, 3);
  push(x1, y0 + rad);
  push(x1, y1 - rad);
  arc(x1 - rad, y1 - rad, 0, H, 3);
  push(x1 - rad, y1);
  push((x0 + x1) / 2, y1);
  push(x0 + rad, y1);
  arc(x0 + rad, y1 - rad, H, Math.PI, 3);
  push(x0, y1 - rad);
  push(x0, y0 + rad);
  arc(x0 + rad, y0 + rad, Math.PI, Math.PI + H, 3);
  return pts;
}

// --- Body sprite: wobbly rounded-rect, 3 frames laid side by side ----------
const BW = 150; // frame width — wider than tall so long buttons stretch the
// corners less (a stretched narrow frame is what turned long buttons into pills)
const BH = 40;
const BFRAMES = 3;
const BMARGIN = 3.5; // inset so the wobble never clips against overflow:hidden
const BR = 6; // corner radius — small, so the ends stay a gently rounded
// rectangle at any width instead of ballooning into a stadium when stretched
const BJIT = 1.7; // jitter amplitude in viewBox units

function bodyPath(): string {
  let d = "";
  for (let f = 0; f < BFRAMES; f++) {
    const rnd = mulberry32(101 + f * 7);
    const base = roundedRectPoints(BMARGIN, BMARGIN, BW - BMARGIN, BH - BMARGIN, BR);
    const jittered: Pt[] = base.map(([x, y]) => [
      x + (rnd() - 0.5) * 2 * BJIT + f * BW,
      y + (rnd() - 0.5) * 2 * BJIT,
    ]);
    d += closedSpline(jittered);
  }
  return d;
}

// --- Sparkle sprite: 4-point twinkle, 4 frames -----------------------------
const SW = 40;
const SFRAMES = 4;
const SCY = 20;
const SOUT = 15; // tip radius
const SIN = 3.4; // inner (pinch) radius
const twScale = [1.0, 0.72, 0.95, 0.82]; // pulse
const twRot = [0, 0.32, -0.18, 0.5]; // radians of wobble

function sparklePath(): string {
  let d = "";
  for (let f = 0; f < SFRAMES; f++) {
    const rnd = mulberry32(211 + f * 13);
    const rot = twRot[f];
    const sc = twScale[f];
    const cx = f * SW + SW / 2;
    const tip: Pt[] = [];
    const inr: Pt[] = [];
    for (let k = 0; k < 4; k++) {
      const aT = rot + k * (Math.PI / 2) - Math.PI / 2;
      const aI = rot + k * (Math.PI / 2) - Math.PI / 4;
      const j = () => (rnd() - 0.5) * 1.1;
      tip.push([cx + Math.cos(aT) * SOUT * sc + j(), SCY + Math.sin(aT) * SOUT * sc + j()]);
      inr.push([
        cx + Math.cos(aI) * SIN * sc + j() * 0.4,
        SCY + Math.sin(aI) * SIN * sc + j() * 0.4,
      ]);
    }
    let seg = `M${r(tip[0][0])} ${r(tip[0][1])}`;
    for (let k = 0; k < 4; k++) {
      const ip = inr[k];
      const nt = tip[(k + 1) % 4];
      seg += `Q${r(ip[0])} ${r(ip[1])} ${r(nt[0])} ${r(nt[1])}`;
    }
    d += seg + "Z";
  }
  return d;
}

const body = {
  d: bodyPath(),
  viewBox: `0 0 ${BW * BFRAMES} ${BH}`,
  width: BW,
  height: BH,
  frames: BFRAMES,
};
const sparkle = {
  d: sparklePath(),
  viewBox: `0 0 ${SW * SFRAMES} ${SW}`,
  width: SW,
  height: SW,
  frames: SFRAMES,
};

const out = `// GENERATED by scripts/gen-button-sprites.ts — DO NOT EDIT BY HAND.
// Static sprite strips for the stop-motion <Button> (components/ui/button.tsx).
// Each strip lays its frames side by side in one viewBox; the button CSS clips
// to a single frame and cycles frames with a stepped X translate to fake the
// hand-redrawn "stop motion" look. See the "Stop-motion button" block in
// app/globals.css.

export interface ButtonSprite {
  /** SVG path data — every frame concatenated left to right. */
  d: string;
  /** viewBox spanning the full strip (all frames). */
  viewBox: string;
  /** Width of a single frame in viewBox units. */
  width: number;
  /** Height of a single frame in viewBox units. */
  height: number;
  /** Number of frames in the strip (the \`steps()\` count). */
  frames: number;
}

/** The wobbly button body — drawn three times so its outline "boils". */
export const BUTTON_BODY_SPRITE: ButtonSprite = ${JSON.stringify(body, null, 2)};

/** A twinkling 4-point sparkle for the optional leading accent icon. */
export const BUTTON_SPARKLE_SPRITE: ButtonSprite = ${JSON.stringify(sparkle, null, 2)};
`;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(root, "lib/button-sprites.ts");
writeFileSync(outPath, out);
console.log(
  `wrote ${outPath}\n  body: ${body.d.length}B / ${body.frames} frames\n  sparkle: ${sparkle.d.length}B / ${sparkle.frames} frames`,
);
