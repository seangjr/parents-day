"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

/** Accessible custom checkbox — a visually-hidden native input drives a styled
 *  box + check via `peer-checked` siblings. */
export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-3 select-none",
        className,
      )}
    >
      <span className="relative inline-flex size-6 shrink-0">
        <input id={inputId} type="checkbox" className="peer sr-only" {...props} />
        <span
          aria-hidden
          className="absolute inset-0 rounded-xs border border-sage/40 bg-shadow/60 transition-colors duration-300 ease-smooth peer-checked:border-lime peer-checked:bg-lime peer-focus-visible:ring-2 peer-focus-visible:ring-lime peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-olive-black"
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto size-4 scale-0 text-olive-black opacity-0 transition-[scale,opacity] duration-200 ease-smooth peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>
      {label ? <span className="text-base text-cream">{label}</span> : null}
    </label>
  );
}
