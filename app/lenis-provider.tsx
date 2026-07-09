"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

// Global Lenis instance driving window scroll (equivalent to `new Lenis({ autoRaf: true })`).
// `root` attaches Lenis to the window and renders children with no wrapper element;
// `autoRaf` is on by default, so the requestAnimationFrame loop is managed internally.
export function LenisProvider({ children }: { children: ReactNode }) {
  return <ReactLenis root>{children}</ReactLenis>;
}
