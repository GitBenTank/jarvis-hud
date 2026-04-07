"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTraceContext } from "@/context/TraceContext";
import type { TracePipelineStage } from "@/context/TraceContext";

const STAGE_ORDER: TracePipelineStage["id"][] = [
  "proposal",
  "approval",
  "policy",
  "execution",
  "receipt",
  "reconciliation",
];

function pendingStages(): TracePipelineStage[] {
  return STAGE_ORDER.map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    status: "pending",
    summary: "—",
    evidence: [],
  }));
}

const BLOCK_STYLES: Record<TracePipelineStage["status"], string> = {
  done: "border-emerald-600/50 bg-emerald-950/20 text-emerald-300 dark:border-emerald-500/50 dark:bg-emerald-950/10 dark:text-emerald-400",
  active: "border-amber-600/50 bg-amber-950/20 text-amber-300 dark:border-amber-500/50 dark:bg-amber-950/10 dark:text-amber-400",
  blocked: "border-red-600/50 bg-red-950/20 text-red-300 dark:border-red-500/50 dark:bg-red-950/10 dark:text-red-400",
  pending: "border-zinc-600/50 bg-zinc-900/30 text-zinc-500 dark:border-zinc-600/50 dark:bg-zinc-800/50 dark:text-zinc-500",
};

function StageBlock({ stage }: { stage: TracePipelineStage }) {
  const style = BLOCK_STYLES[stage.status];
  return (
    <div
      className={`flex min-w-0 flex-col rounded border px-2 py-1.5 ${style}`}
      aria-label={`${stage.label}: ${stage.status}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-90">{stage.label}</span>
      {stage.summary && stage.summary !== "—" && (
        <span className="mt-0.5 truncate text-[10px] opacity-80" title={stage.summary}>
          {stage.summary}
        </span>
      )}
      {stage.reason && (
        <span className="mt-0.5 truncate text-[10px] opacity-90" title={stage.reason.summary}>
          {stage.reason.label}
        </span>
      )}
    </div>
  );
}

export default function ExecutionTimeline() {
  const { activeTraceId, traceData, loading } = useTraceContext();

  const stages = useMemo(() => {
    return traceData?.pipeline?.stages ?? [];
  }, [traceData]);

  const emptyStages = useMemo(() => pendingStages(), []);

  const containerClass =
    "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";

  if (loading) {
    return (
      <div className={containerClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading pipeline…</p>
      </div>
    );
  }

  if (!activeTraceId || !traceData) {
    return (
      <div className={containerClass}>
        <div className="mb-2 flex flex-wrap gap-2">
          {emptyStages.map((s) => (
            <StageBlock key={s.id} stage={s} />
          ))}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Load a trace to see pipeline state. Click a trace link from{" "}
          <Link href="/activity" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
            Activity
          </Link>{" "}
          or a proposal.
        </p>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className={containerClass}>
        <div className="mb-2 flex flex-wrap gap-2">
          {emptyStages.map((s) => (
            <StageBlock key={s.id} stage={s} />
          ))}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">No stages for this trace.</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-stretch gap-2">
        {stages.map((s) => (
          <StageBlock key={s.id} stage={s} />
        ))}
      </div>
    </div>
  );
}
