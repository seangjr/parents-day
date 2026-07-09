"use client";

import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";
import { cn } from "@/lib/cn";

interface LedQrProps {
  /** Path (on this origin) the QR deep-links to. Defaults to the foyer landing. */
  path?: string;
  /** Rendered QR resolution in px. */
  pixels?: number;
  className?: string;
}

/**
 * The join QR shown on the LED (SPEC story 20): a scannable card pointing at the
 * foyer landing so anyone in the room can take the quiz. Rendered in brand
 * colours (olive-black modules on pale lime). If generation fails it degrades to
 * a quiet placeholder — the LED never blanks on it.
 */
export function LedQr({ path = "/", pixels = 320, className }: LedQrProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}${path}`;
    toDataURL(url, {
      margin: 1,
      width: pixels,
      color: { dark: "#10150f", light: "#f0f4a6" },
    })
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        // Non-fatal — the header + instructions still tell people how to join.
      });
    return () => {
      cancelled = true;
    };
  }, [path, pixels]);

  return (
    <div className={cn("overflow-hidden rounded-[1.5rem] bg-lime", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Scan to join the wall" className="block size-full" />
      ) : (
        <div className="flex size-full items-center justify-center text-sm text-olive-black/60">
          Generating QR…
        </div>
      )}
    </div>
  );
}
