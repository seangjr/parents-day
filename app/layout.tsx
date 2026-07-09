import type { Metadata } from "next";
import { Oooh_Baby, Big_Shoulders, Geist } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "./lenis-provider";
import { TransitionProvider } from "@/components/transition";
import Link from "next/link";
import { FgaLogo } from "@/components/ui/fga-logo";

const displayFont = Oooh_Baby({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-oooh-baby",
  display: "swap",
});

const condensedFont = Big_Shoulders({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-big-shoulders",
  display: "swap",
  // Pin the fallback: next/font can't derive override metrics for the
  // "Big Shoulders" family, which emits a build warning. We supply an explicit
  // fallback stack and skip the automatic size-adjust instead.
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "sans-serif"],
});

const bodyFont = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Love Revealed — Parents Day 2026",
  description:
    "Discover how you and your family give and receive love. Answer 5 quick questions and join the live family wall.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${condensedFont.variable} ${bodyFont.variable} antialiased`}
    >
      <body className="min-h-dvh">
        <Link
          href="/"
          aria-label="FGA — Parents Day 2026 home"
          className="fixed left-6 top-6 z-50 flex flex-col items-center gap-2 transition-opacity hover:opacity-70 sm:left-8 sm:top-8"
        >
          <FgaLogo className="h-5 w-auto" />
          <span className="font-condensed text-xs font-bold uppercase tracking-[0.2em] text-lime">
            Parents Day 2026
          </span>
        </Link>
        <LenisProvider>
          <TransitionProvider>{children}</TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
