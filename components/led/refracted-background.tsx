"use client";

import Image from "next/image";
import Script from "next/script";
import { useCallback, useRef } from "react";

const UNICORN_STUDIO_SRC =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.0/dist/unicornStudio.umd.js";

declare global {
  interface Window {
    UnicornStudio?: {
      init: () => Promise<unknown>;
    };
  }
}

/**
 * Full-bleed LED backdrop using Osmo's refracted-glass Unicorn Studio scene.
 * The plain image remains underneath as the permanent loading/error fallback.
 */
export function RefractedBackground() {
  const initialized = useRef(false);

  const initializeScene = useCallback(() => {
    if (initialized.current || !window.UnicornStudio) return;
    // Reduced motion: keep the static image fallback and never boot the
    // animated Unicorn Studio scene.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    initialized.current = true;
    window.UnicornStudio.init().catch((error: unknown) => {
      initialized.current = false;
      console.error("Unable to initialize the LED background", error);
    });
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/led-bg.png"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="refract__item absolute inset-0 size-full"
        data-us-alttext="Shadows of a family holding hands on a path"
        data-us-project-src="/api/led-background"
        data-us-scale="1"
        data-us-dpi="1"
        data-us-lazyload="false"
        data-us-production="true"
      />
      <Script
        src={UNICORN_STUDIO_SRC}
        strategy="afterInteractive"
        onReady={initializeScene}
      />
    </div>
  );
}
