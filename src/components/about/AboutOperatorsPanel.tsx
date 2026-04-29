"use client";

import { useState } from "react";
import SystemStatus from "@/components/SystemStatus";

/** Collapsible so the About narrative stays foremost; operators peel back the HUD when needed. */
export function AboutOperatorsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/40 transition-colors hover:border-white/[0.12]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="about-system-status"
        id="about-operators-trigger"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04]"
      >
        <div>
          <p className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Operators only
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-100">
            Live connectors, paths, auth, dev controls
          </p>
        </div>
        <span
          className={`shrink-0 text-lg leading-none text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ⌄
        </span>
      </button>
      {open ? (
        <div
          id="about-system-status"
          role="region"
          aria-labelledby="about-operators-trigger"
          className="border-t border-white/[0.06] px-5 pb-5 pt-4"
        >
          <SystemStatus />
        </div>
      ) : null}
    </div>
  );
}
