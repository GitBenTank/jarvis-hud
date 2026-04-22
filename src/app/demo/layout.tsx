import type { ReactNode } from "react";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

const demoSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-demo-sans",
});

const demoMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-demo-mono",
});

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${demoSans.variable} ${demoMono.variable} min-h-screen antialiased [font-family:var(--font-demo-sans),system-ui,sans-serif]`}
    >
      {children}
    </div>
  );
}
