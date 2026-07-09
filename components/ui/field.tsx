"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labelled text input with hint/error text and wired-up aria-describedby. */
export function Field({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-condensed text-sm font-bold uppercase tracking-wide text-sage"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-xs border bg-shadow/60 px-4 py-3 text-cream transition-colors duration-300 ease-smooth placeholder:text-sage/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-lime",
          error ? "border-peach" : "border-sage/30",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-peach">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-sage/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
