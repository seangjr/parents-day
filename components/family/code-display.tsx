"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

interface CodeDisplayProps {
  code: string;
  className?: string;
}

/** The Family Code shown large, with tap-to-copy for sharing across phones. */
export function CodeDisplay({ code, className }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked — the code stays visible to read out or type.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy Family Code ${code}`}
      className={cn(
        "group flex w-full items-center justify-center gap-4 rounded-card border border-lime/40 bg-shadow/60 px-6 py-5 transition-colors duration-300 ease-smooth hover:border-lime/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime",
        className,
      )}
    >
      <span className="font-condensed text-4xl font-bold uppercase tracking-[0.15em] text-lime">
        {code}
      </span>
      <span
        aria-hidden
        className="text-sage transition-colors duration-300 ease-smooth group-hover:text-cream"
      >
        {copied ? (
          <Check className="size-5 text-lime" />
        ) : (
          <Copy className="size-5" />
        )}
      </span>
      <span role="status" className="sr-only">
        {copied ? "Family Code copied" : ""}
      </span>
    </button>
  );
}
