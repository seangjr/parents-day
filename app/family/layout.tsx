import type { ReactNode } from "react";
import { ParticipantProvider } from "@/lib/participant";

/**
 * Shell for the family flow (hub → create/join → mix). The participant store is
 * client-first (localStorage), so wrapping here rehydrates the same Participant
 * this device used in the quiz flow — its id joins families and its name/role
 * feed the mix. Mirrors the experience column so the two flows feel continuous.
 */
export default function FamilyLayout({ children }: { children: ReactNode }) {
  return (
    <ParticipantProvider>
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-moss/20 blur-3xl"
        />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </main>
    </ParticipantProvider>
  );
}
