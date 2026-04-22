"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export function Subtitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-5 max-w-xl text-center text-base font-normal leading-relaxed text-zinc-400 sm:text-lg md:text-xl",
        className,
      )}
    >
      {children}
    </p>
  );
}
