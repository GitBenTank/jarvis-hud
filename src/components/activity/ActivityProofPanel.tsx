"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ActivityGraph from "@/components/ActivityGraph";
import TracePanel from "@/components/TracePanel";
import {
  ACTIVITY_PROOF_TAB_EVENT,
  type ActivityProofTab,
  type ActivityProofTabEventDetail,
} from "@/lib/activity-proof-ui";

function tabButtonClass(active: boolean): string {
  return `rounded-t px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
    active
      ? "border border-b-0 border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
      : "border border-transparent border-b-zinc-300 text-zinc-500 hover:text-zinc-800 dark:border-b-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200"
  }`;
}

function ActivityProofPanelBody({
  initialTab,
}: Readonly<{ initialTab: ActivityProofTab }>) {
  const [tab, setTab] = useState<ActivityProofTab>(initialTab);

  useEffect(() => {
    const fn = (e: Event) => {
      const ce = e as CustomEvent<ActivityProofTabEventDetail>;
      const next = ce.detail?.tab;
      if (next !== "graph" && next !== "timeline") return;
      setTab(next);
      queueMicrotask(() => {
        document
          .getElementById("activity-proof-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    };
    globalThis.addEventListener(ACTIVITY_PROOF_TAB_EVENT, fn as EventListener);
    return () =>
      globalThis.removeEventListener(
        ACTIVITY_PROOF_TAB_EVENT,
        fn as EventListener
      );
  }, []);

  return (
    <section
      id="activity-proof-panel"
      aria-label="Proof — graph and timeline"
      className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-end gap-0 border-b border-zinc-200 px-2 pt-2 dark:border-zinc-800">
        <button
          type="button"
          className={tabButtonClass(tab === "graph")}
          onClick={() => setTab("graph")}
        >
          Graph
        </button>
        <button
          type="button"
          className={tabButtonClass(tab === "timeline")}
          onClick={() => setTab("timeline")}
        >
          Timeline
        </button>
        <span className="mb-2 ml-auto hidden text-[10px] uppercase tracking-wider text-zinc-400 sm:inline">
          Audit depth
        </span>
      </div>
      <div className="min-h-0 max-h-[min(420px,50vh)] overflow-auto p-2">
        {tab === "graph" ? (
          <div className="min-h-[220px]">
            <ActivityGraph />
          </div>
        ) : (
          <div className="min-h-[220px]">
            <Suspense
              fallback={
                <div className="rounded border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Loading timeline…
                </div>
              }
            >
              <TracePanel />
            </Suspense>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ActivityProofPanel() {
  const searchParams = useSearchParams();
  const traceKey = searchParams.get("trace")?.trim() ?? "";
  const remountKey = traceKey ? `trace:${traceKey}` : "no-trace";
  const initialTab: ActivityProofTab = traceKey ? "timeline" : "graph";

  return (
    <ActivityProofPanelBody key={remountKey} initialTab={initialTab} />
  );
}
