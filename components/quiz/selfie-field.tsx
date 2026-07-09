"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** Cap the stored selfie so the data URL stays small enough for localStorage. */
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.82;

/** Downscale a picked image to a small JPEG data URL. */
function fileToDataUrl(file: File): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Could not read the image."));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error("Could not decode the image."));
    img.onload = () => {
      const scale = Math.min(
        1,
        MAX_DIMENSION / Math.max(img.width, img.height),
      );
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
  return promise;
}

interface SelfieFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

/** Optional, always-skippable selfie capture → a downscaled data URL. */
export function SelfieField({ value, onChange }: SelfieFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be picked again
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await fileToDataUrl(file));
    } catch {
      setError("That photo didn’t work — you can skip it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-condensed text-sm font-bold uppercase tracking-wide text-sage">
        Selfie <span className="font-normal normal-case text-sage/60">— optional</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={handleFile}
      />
      {value ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Your selfie"
            className="size-16 shrink-0 rounded-card border border-sage/30 object-cover"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xs border border-sage/30 px-3 py-1.5 text-sm text-sage transition-colors duration-300 ease-smooth hover:border-sage/60 hover:text-cream"
            >
              <RefreshCw className="size-4" aria-hidden />
              Retake
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1.5 rounded-xs border border-sage/30 px-3 py-1.5 text-sm text-sage transition-colors duration-300 ease-smooth hover:border-peach/60 hover:text-peach"
            >
              <Trash2 className="size-4" aria-hidden />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "flex items-center gap-3 rounded-card border border-dashed border-sage/40 p-4 text-left text-sage transition-colors duration-300 ease-smooth hover:border-sage/70 hover:text-cream disabled:opacity-50",
          )}
        >
          <Camera className="size-5 shrink-0" aria-hidden />
          <span>{busy ? "Adding photo…" : "Add a selfie"}</span>
        </button>
      )}
      {error ? <p className="text-sm text-peach">{error}</p> : null}
    </div>
  );
}
