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
        "max-w-4xl text-center text-4xl font-medium tracking-tight text-zinc-50 sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.05]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
