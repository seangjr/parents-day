"use client";

/**
 * Participant store — the client-first source of truth for one person for one
 * pass through the experience (ADR-0001 client-first results).
 *
 * Holds an anonymous client-generated id, the profile (first name, role,
 * optional selfie) and the five quiz answers, mirrored to `sessionStorage` so a
 * mid-flow reload resumes in place. Scope is deliberately one browser session,
 * and the landing page clears it (`clearParticipant`), so the next person on
 * the same device always starts blank with a fresh id — nothing pre-fills and
 * a new Submission never overwrites the previous person's. A retake within one
 * session overwrites in place (idempotent) — the id is stable until then.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { QuizAnswer } from "@/lib/love-styles";
import type { Role } from "@/lib/scoring";

/** Number of forced-choice quiz questions (ADR-0003: five answers A–E). */
export const QUESTION_COUNT = 5;

/** sessionStorage key — one Participant per pass through the flow. */
const STORAGE_KEY = "love-revealed:participant";

/** Role chips shown at the profile step; `value` is the logic-bearing Role. */
export interface RoleOption {
  value: Role;
  label: string;
}

/** The five selectable roles (CONTEXT.md → Role). */
export const ROLE_OPTIONS: readonly RoleOption[] = [
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "grandparent", label: "Grandparent" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

/** Static membership table for validating a persisted role string. */
const ROLE_VALUES: Record<Role, true> = {
  parent: true,
  child: true,
  grandparent: true,
  guardian: true,
  other: true,
};

/** The profile fields captured before the quiz. */
export interface ParticipantProfile {
  firstName: string;
  role: Role | null;
  /** Optional selfie as a (downscaled) data URL; always skippable. */
  selfie: string | null;
}

/** The Family this device created or joined (ADR-0002): its Code + display Name. */
export interface FamilyRef {
  /** Server-minted, confusion-safe Family Code — the unique identifier. */
  code: string;
  /** Non-unique display Family Name, e.g. "The Tan Family". */
  name: string;
}

/** Everything held for the one Participant on this device. */
export interface ParticipantState extends ParticipantProfile {
  /** Client-generated anonymous id (ADR-0002). */
  id: string;
  /** The Family joined in Step 1 of the wizard, or null before then. */
  family: FamilyRef | null;
  /** Fixed-length answer slots; `null` = not yet answered. */
  answers: (QuizAnswer | null)[];
}

/** The store surface exposed through context. */
export interface ParticipantStore {
  participant: ParticipantState;
  /** True once state has been hydrated from sessionStorage on the client. */
  ready: boolean;
  /** First name and role are both set. */
  hasProfile: boolean;
  /** A Family has been created or joined (Step 1 complete). */
  hasFamily: boolean;
  answeredCount: number;
  /** All five answers, in order — or null until the quiz is complete. */
  completedAnswers: QuizAnswer[] | null;
  setProfile: (profile: ParticipantProfile) => void;
  /** Remember (or clear) the Family created or joined in Step 1. */
  setFamily: (family: FamilyRef | null) => void;
  setAnswer: (index: number, answer: QuizAnswer) => void;
  /** Retake: clear answers, keep the same id + profile (idempotent). */
  retake: () => void;
  /** Start over: fresh id, cleared profile + answers. */
  reset: () => void;
}

function emptyAnswers(): (QuizAnswer | null)[] {
  return Array.from({ length: QUESTION_COUNT }, () => null);
}

/** A random anonymous id, preferring crypto.randomUUID where available. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** Deterministic default used for the server render (no id, not hydrated). */
function freshState(): ParticipantState {
  return { id: "", firstName: "", role: null, selfie: null, family: null, answers: emptyAnswers() };
}

function isQuizAnswer(value: unknown): value is QuizAnswer {
  return (
    value === "A" ||
    value === "B" ||
    value === "C" ||
    value === "D" ||
    value === "E"
  );
}

/** Coerce a persisted family blob into a FamilyRef, or null. */
function coerceFamily(raw: unknown): FamilyRef | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.code !== "string" || typeof value.name !== "string") return null;
  const code = value.code.trim();
  const name = value.name.trim();
  return code && name ? { code, name } : null;
}

/** Defensively coerce a persisted blob into a valid ParticipantState. */
function coerce(raw: unknown): ParticipantState | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = typeof value.id === "string" && value.id ? value.id : newId();
  const firstName = typeof value.firstName === "string" ? value.firstName : "";
  const role =
    typeof value.role === "string" && value.role in ROLE_VALUES
      ? (value.role as Role)
      : null;
  const selfie = typeof value.selfie === "string" ? value.selfie : null;
  const family = coerceFamily(value.family);
  const answers = emptyAnswers();
  if (Array.isArray(value.answers)) {
    for (let i = 0; i < QUESTION_COUNT; i++) {
      const a = value.answers[i];
      answers[i] = isQuizAnswer(a) ? a : null;
    }
  }
  return { id, firstName, role, selfie, family, answers };
}

function load(): ParticipantState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = coerce(JSON.parse(raw) as unknown);
      if (parsed) return parsed;
    }
  } catch {
    // Corrupt or unavailable storage falls through to a fresh id.
  }
  return { ...freshState(), id: newId() };
}

function persist(state: ParticipantState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage disabled — degrade to in-memory only.
  }
}

/** Drop the persisted Participant so the next hydration starts blank. */
export function clearParticipant(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage disabled — nothing was persisted anyway.
  }
}

/**
 * Renders nothing; clears the persisted Participant on mount. Mounted on the
 * landing page so reaching it (a fresh QR scan, or "Done" at the end of the
 * flow) always hands the next person a blank slate. Mid-flow reloads never
 * pass through the landing, so resume-in-place is unaffected.
 */
export function ParticipantReset(): null {
  useEffect(() => {
    clearParticipant();
  }, []);
  return null;
}

const ParticipantContext = createContext<ParticipantStore | null>(null);

/** Owns the participant state; hydrates from and persists to sessionStorage. */
export function ParticipantProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<ParticipantState>(freshState);
  const [ready, setReady] = useState(false);

  // Hydrate once on mount. The server render has no sessionStorage, so the
  // first client render matches it (empty id, not ready) — no hydration mismatch.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setParticipant(load());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Persist every change after hydration.
  useEffect(() => {
    if (ready) persist(participant);
  }, [participant, ready]);

  const setProfile = useCallback((profile: ParticipantProfile) => {
    setParticipant((s) => ({ ...s, ...profile }));
  }, []);

  const setFamily = useCallback((family: FamilyRef | null) => {
    setParticipant((s) => ({ ...s, family }));
  }, []);

  const setAnswer = useCallback((index: number, answer: QuizAnswer) => {
    setParticipant((s) => {
      if (index < 0 || index >= QUESTION_COUNT) return s;
      const answers = s.answers.slice();
      answers[index] = answer;
      return { ...s, answers };
    });
  }, []);

  const retake = useCallback(() => {
    setParticipant((s) => ({ ...s, answers: emptyAnswers() }));
  }, []);

  const reset = useCallback(() => {
    setParticipant({ ...freshState(), id: newId() });
  }, []);

  const store = useMemo<ParticipantStore>(() => {
    const answered = participant.answers.filter(
      (a): a is QuizAnswer => a !== null,
    );
    return {
      participant,
      ready,
      hasProfile:
        participant.firstName.trim() !== "" && participant.role !== null,
      hasFamily: participant.family !== null,
      answeredCount: answered.length,
      completedAnswers:
        answered.length === QUESTION_COUNT ? answered : null,
      setProfile,
      setFamily,
      setAnswer,
      retake,
      reset,
    };
  }, [participant, ready, setProfile, setFamily, setAnswer, retake, reset]);

  return createElement(ParticipantContext.Provider, { value: store }, children);
}

/** Read the participant store. Must be used within <ParticipantProvider>. */
export function useParticipant(): ParticipantStore {
  const ctx = useContext(ParticipantContext);
  if (!ctx) {
    throw new Error("useParticipant must be used within <ParticipantProvider>.");
  }
  return ctx;
}
