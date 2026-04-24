import type { ReactNode } from "react";

/**
 * Uses root Geist variables (--font-geist-sans / --font-geist-mono) for a clean,
 * neutral keynote surface — no separate “demo” face that reads generic/AI.
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`min-h-screen antialiased [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif]`}
    >
      {children}
    </div>
  );
}
