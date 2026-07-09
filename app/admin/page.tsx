import type { Metadata } from "next";
import { AdminConsole } from "./admin-client";

export const metadata: Metadata = {
  title: "Love Revealed — Admin",
  description: "Operator console for Parents Day 2026.",
  robots: { index: false, follow: false },
};

/**
 * The operator console (ADR-0006), gated with `/led` behind the shared secret in
 * proxy.ts. One shared login, no roles: start/stop the event, drive the LED
 * mode, trigger a Photo Moment, monitor Submissions + Families, remove an item,
 * and reset all data (SPEC stories 26–32).
 */
export default function AdminPage() {
  return <AdminConsole />;
}
