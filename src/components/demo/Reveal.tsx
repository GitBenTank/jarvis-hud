"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { useReveal } from "./useReveal";

export function Reveal({
  children,
  delayMs = 0,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]",
        visible ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0",
        className,
      )}
      style={{
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
