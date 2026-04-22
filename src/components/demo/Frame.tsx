"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export function Frame({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative flex min-h-screen w-full snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8 sm:py-20",
        className,
      )}
    >
      {children}
    </section>
  );
}
