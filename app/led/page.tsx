import type { Metadata } from "next";
import { LedClient } from "./led-client";

export const metadata: Metadata = {
  title: "Love Revealed — LED Wall",
  description: "The live Parents Day 2026 family wall.",
};

/**
 * The foyer LED wall (ADR-0004). A fullscreen kiosk that polls `/api/led-state`
 * and reveals results live — individual joins, family mixes, the community
 * dashboard, photo moments — never blanking. Gated with `/admin` by the
 * six-digit event PIN in Next.js Proxy (ADR-0006).
 */
export default function LedPage() {
  return <LedClient />;
}
