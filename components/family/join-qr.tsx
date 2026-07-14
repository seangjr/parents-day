"use client";

import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";
import { cn } from "@/lib/cn";
import { SplitReveal } from "@/components/animation/split-reveal";

interface JoinQrProps {
  code: string;
  className?: string;
}

/**
 * A scannable join-QR that deep-links to the join-confirm screen for this
 * Family Code, so a member can join without typing (ADR-0002). The QR is a
 * convenience over the code — if generation fails, the code alone still works.
 */
export function JoinQr({ code, className }: JoinQrProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/family/join?code=${encodeURIComponent(code)}`;
    toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: "#10150f", light: "#f0f4a6" },
    })
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        // Non-fatal — the Family Code is the primary join path.
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="overflow-hidden rounded-card border border-lime/30 bg-lime p-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`QR code to join ${code}`}
            width={192}
            height={192}
            className="size-48"
          />
        ) : (
          <div className="flex size-48 items-center justify-center text-olive-black/60">
            <span className="text-sm">Generating QR…</span>
          </div>
        )}
      </div>
      <SplitReveal as="p" className="text-center text-sm text-sage">
        Scan to join — or share the code.
      </SplitReveal>
    </div>
  );
}
