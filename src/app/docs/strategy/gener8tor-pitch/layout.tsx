import type { ReactNode } from "react";

export default function Gener8torPitchLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={`[font-family:var(--font-geist-sans),ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif]`}
    >
      {children}
    </div>
  );
}
