import type { ReactNode } from "react";
import { ParticipantProvider } from "@/lib/participant";

/**
 * Shell for the participant flow (start → quiz → result). The provider lives
 * here so participant state survives navigation between the steps, and a mobile
 * column keeps everything within comfortable thumb reach.
 */
export default function ExperienceLayout({
  children,
}: {
  children: ReactNode;
}) {
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
