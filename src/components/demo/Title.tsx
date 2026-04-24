"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export function Title({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={cn(
        "max-w-4xl text-center text-4xl font-semibold tracking-[-0.028em] text-zinc-50 sm:text-5xl md:text-6xl lg:text-[4.1rem] lg:leading-[1.06]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
