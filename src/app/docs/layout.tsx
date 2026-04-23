import type { ReactNode } from "react";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { DocsAmbient } from "@/components/docs/DocsAmbient";

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

/** Dark Jarvis shell for /docs (same atmosphere family as /demo). */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${docsSans.variable} ${docsMono.variable} relative min-h-screen bg-[#050508] text-zinc-100 antialiased [font-family:var(--font-docs-sans),system-ui,sans-serif]`}
    >
      <DocsAmbient />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
