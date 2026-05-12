"use client";

import Link from "next/link";
import ExecutionTimeline from "@/components/ExecutionTimeline";
import { useTraceContext } from "@/context/TraceContext";
import { activityTraceHref } from "@/lib/activity-trace-href";
import {
  ACTIVITY_PROOF_TAB_EVENT,
  type ActivityProofTabEventDetail,
} from "@/lib/activity-proof-ui";

function shortenTraceId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function ActivityProofRailContent() {
  const { activeTraceId, traceData, loading, error } = useTraceContext();

  const focusProofTimeline = () => {
    globalThis.dispatchEvent(
      new CustomEvent<ActivityProofTabEventDetail>(ACTIVITY_PROOF_TAB_EVENT, {
        detail: { tab: "timeline" },
      })
    );
  };

  const lastArtifact =
    traceData?.artifactPaths && traceData.artifactPaths.length > 0
      ? traceData.artifactPaths[traceData.artifactPaths.length - 1]
      : null;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          Execution pipeline
        </h2>
        <div className="p-2">
          <ExecutionTimeline />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Active trace
        </h3>
        {loading && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Loading trace…
          </p>
        )}
        {!loading && error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {!loading && !error && !activeTraceId && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Open a trace from a proposal link, or use{" "}
            <button
              type="button"
              className="font-medium text-amber-600 underline hover:text-amber-500 dark:text-amber-400"
              onClick={focusProofTimeline}
            >
              Timeline
            </button>{" "}
            below to paste a trace id.
          </p>
        )}
        {!loading && activeTraceId && (
          <div className="mt-2 space-y-2">
            <code className="block break-all font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
              {shortenTraceId(activeTraceId)}
            </code>
            {lastArtifact && (
              <p
                className="truncate text-[11px] text-zinc-500 dark:text-zinc-400"
                title={lastArtifact}
              >
                Last artifact: {lastArtifact}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link
                href={activityTraceHref(activeTraceId)}
                className="text-xs font-medium text-amber-600 underline hover:text-amber-500 dark:text-amber-400"
              >
                Share link
              </Link>
              <button
                type="button"
                className="text-xs font-medium text-amber-600 underline hover:text-amber-500 dark:text-amber-400"
                onClick={focusProofTimeline}
              >
                Proof → Timeline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityProofRail() {
  return (
    <>
      <details className="group rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-zinc-700 marker:content-none dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
          <span className="select-none">
            Pipeline & trace
            <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
              (expand)
            </span>
          </span>
        </summary>
        <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
          <ActivityProofRailContent />
        </div>
      </details>

      <aside
        aria-label="Execution pipeline and trace context"
        className="hidden min-w-0 lg:flex lg:flex-col lg:gap-4"
      >
        <ActivityProofRailContent />
      </aside>
    </>
  );
}
