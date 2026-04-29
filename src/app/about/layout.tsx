import type { ReactNode } from "react";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

const docsSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-docs-sans",
});

const docsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-docs-mono",
});

/** Same shell as /docs — one visual family with the documentation home. */
export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${docsSans.variable} ${docsMono.variable} min-h-screen bg-[#050508] text-zinc-100 antialiased [font-family:var(--font-docs-sans),system-ui,sans-serif]`}
    >
      {children}
    </div>
  );
}
