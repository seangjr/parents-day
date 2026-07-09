"use client";

import { useEffect, useRef, useState } from "react";
import {
  initialLedState,
  reduceLed,
  type LedDirective,
  type LedStateResponse,
} from "@/lib/led-orchestrator";
import { LedStage } from "./led-screens";

/** Poll the read endpoint every ~1–2s (ADR-0001). */
const POLL_MS = 1500;
/** Advance reveal timing between polls so cadence is smooth (ADR-0004). */
const TICK_MS = 500;

/**
 * The LED wall client. Polls `/api/led-state`, feeds each response and a steady
 * timing tick into the pure orchestrator, and renders whatever screen the
 * directive names. The orchestrator state lives in a ref (it is timing state,
 * not render state); only the directive drives React.
 *
 * Resilience (SPEC story 25): a failed poll holds the last frame and keeps the
 * cursor, so the next successful poll resyncs the log delta — the wall never
 * blanks and never loses reveals.
 */
export function LedClient() {
  const stateRef = useRef(initialLedState(Date.now()));
  const cursorRef = useRef(0);
  const [directive, setDirective] = useState<LedDirective>({
    mode: "welcome",
    key: "welcome",
    payload: {},
  });

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/led-state?cursor=${cursorRef.current}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`led-state ${res.status}`);
        const data = (await res.json()) as LedStateResponse;
        cursorRef.current = data.cursor;
        const result = reduceLed(stateRef.current, { type: "poll", now: Date.now(), data });
        stateRef.current = result.state;
        if (!cancelled) setDirective(result.directive);
      } catch {
        // Hold the last frame; the same cursor resyncs on the next poll.
      }
    }
    void poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const result = reduceLed(stateRef.current, { type: "tick", now: Date.now() });
      stateRef.current = result.state;
      setDirective(result.directive);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return <LedStage directive={directive} />;
}
