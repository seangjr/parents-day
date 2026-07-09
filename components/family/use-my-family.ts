"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Feature-local persistence of the Family this device created or joined. The
 * shared participant store (lib/participant) is intentionally family-agnostic,
 * so S05 remembers the code here — enough for the hub to route back to the mix
 * and for create/join to hand off to `/family/[code]`.
 */
const STORAGE_KEY = "love-revealed:family";

export interface MyFamily {
  /** The Family Code last created or joined on this device, or null. */
  code: string | null;
  /** True once read from localStorage on the client (avoids a hydration flash). */
  ready: boolean;
  /** Remember (or clear, with null) the joined Family Code. */
  setCode: (code: string | null) => void;
}

export function useMyFamily(): MyFamily {
  const [code, setCodeState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setCodeState(stored);
    } catch {
      // Storage may be unavailable (private mode) — degrade to no memory.
    }
    setReady(true);
  }, []);

  const setCode = useCallback((next: string | null) => {
    setCodeState(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures — the code still lives in this session's state.
    }
  }, []);

  return { code, ready, setCode };
}
