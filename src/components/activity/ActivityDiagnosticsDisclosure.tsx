"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { shouldOpenActivityDiagnosticsDisclosure } from "@/lib/activity-diagnostics-disclosure-open";

type ActivityDiagnosticsDisclosureProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Collapses trust / status / OpenClaw on Activity when healthy; opens when
 * integration issues, receive path, auth step-up, SoD, policy block, or control UI probe fail.
 */
export default function ActivityDiagnosticsDisclosure({
  children,
}: ActivityDiagnosticsDisclosureProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config", { credentials: "include" });
        const json: unknown = await res.json();
        if (!res.ok) {
          if (!cancelled && detailsRef.current) detailsRef.current.open = true;
          return;
        }
        const shouldOpen = shouldOpenActivityDiagnosticsDisclosure(json);
        if (!cancelled && shouldOpen && detailsRef.current) {
          detailsRef.current.open = true;
        }
      } catch {
        if (!cancelled && detailsRef.current) {
          detailsRef.current.open = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      className="group mb-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-zinc-700 marker:content-none dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
        <span className="select-none">
          Environment, trust & integration
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            (expand)
          </span>
        </span>
      </summary>
      <div className="border-t border-zinc-200 px-2 pb-3 pt-1 dark:border-zinc-800">
        {children}
      </div>
    </details>
  );
}
