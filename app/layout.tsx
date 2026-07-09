import type { Metadata } from "next";
import { Oooh_Baby, Big_Shoulders, Geist } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "./lenis-provider";

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
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
