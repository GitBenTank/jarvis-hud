"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTraceContext } from "@/context/TraceContext";
import type { TraceAction, TraceEvent, TracePolicyDecision } from "@/context/TraceContext";

type StageStatus = "pending" | "active" | "done" | "blocked";

type PipelineStage = {
  id: string;
  label: string;
  status: StageStatus;
  at?: string;
  detail?: string;
};

const STAGE_ORDER = ["proposal", "approval", "policy", "execution", "receipt"] as const;

function buildPipelineStages(
  events: TraceEvent[],
  policyDecisions: TracePolicyDecision[] | undefined,
  actions: TraceAction[]
): PipelineStage[] {
  const primaryEvent = events[0];
  if (!primaryEvent) return [];

  const agent = primaryEvent.source?.connector ?? "agent";
  const policy = (policyDecisions ?? []).at(-1);
  const policyDenied = policy?.decision === "deny";
  const receipt = actions.find((a) => a.approvalId === primaryEvent.id);

  const proposal: PipelineStage = {
    id: "proposal",
    label: "Proposal",
    status: "done",
    at: primaryEvent.createdAt,
    detail: `${agent} · ${primaryEvent.kind}`,
  };

  let approval: PipelineStage;
  if (primaryEvent.rejectedAt) {
    approval = { id: "approval", label: "Approval", status: "blocked", at: primaryEvent.rejectedAt, detail: "Rejected" };
  } else if (primaryEvent.approvedAt || primaryEvent.executed) {
    approval = {
      id: "approval",
      label: "Approval",
      status: "done",
      at: primaryEvent.approvedAt ?? primaryEvent.createdAt,
      detail: "Approved",
    };
  } else {
    approval = { id: "approval", label: "Approval", status: "active", detail: "Awaiting" };
  }

  let policyStage: PipelineStage;
  if (policy) {
    policyStage = {
      id: "policy",
      label: "Policy",
      status: policyDenied ? "blocked" : "done",
      at: policy.timestamp,
      detail: policy.decision,
    };
  } else if (primaryEvent.approvedAt && !primaryEvent.rejectedAt) {
    policyStage = { id: "policy", label: "Policy", status: "active", detail: "On execute" };
  } else {
    policyStage = { id: "policy", label: "Policy", status: "pending", detail: "—" };
  }

  let execution: PipelineStage;
  if (policyDenied) {
    execution = { id: "execution", label: "Execution", status: "pending", detail: "—" };
  } else if (primaryEvent.failedAt) {
    execution = { id: "execution", label: "Execution", status: "blocked", at: primaryEvent.failedAt, detail: "Failed" };
  } else if (primaryEvent.executed) {
    execution = {
      id: "execution",
      label: "Execution",
      status: "done",
      at: primaryEvent.executedAt ?? receipt?.at,
      detail: receipt?.kind ?? "done",
    };
  } else if (primaryEvent.approvedAt) {
    execution = { id: "execution", label: "Execution", status: "active", detail: "Ready" };
  } else {
    execution = { id: "execution", label: "Execution", status: "pending", detail: "—" };
  }

  let receiptStage: PipelineStage;
  if (receipt) {
    receiptStage = {
      id: "receipt",
      label: "Receipt",
      status: "done",
      at: receipt.at,
      detail: receipt.outputPath?.split("/").slice(-2).join("/") ?? receipt.kind,
    };
  } else if (primaryEvent.executed) {
    receiptStage = { id: "receipt", label: "Receipt", status: "pending", detail: "Writing" };
  } else {
    receiptStage = { id: "receipt", label: "Receipt", status: "pending", detail: "—" };
  }

  return [proposal, approval, policyStage, execution, receiptStage];
}

function pendingStages(): PipelineStage[] {
  return STAGE_ORDER.map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    status: "pending" as StageStatus,
    detail: "—",
  }));
}

const BLOCK_STYLES: Record<StageStatus, string> = {
  done: "border-emerald-600/50 bg-emerald-950/20 text-emerald-300 dark:border-emerald-500/50 dark:bg-emerald-950/10 dark:text-emerald-400",
  active: "border-amber-600/50 bg-amber-950/20 text-amber-300 dark:border-amber-500/50 dark:bg-amber-950/10 dark:text-amber-400",
  blocked: "border-red-600/50 bg-red-950/20 text-red-300 dark:border-red-500/50 dark:bg-red-950/10 dark:text-red-400",
  pending: "border-zinc-600/50 bg-zinc-900/30 text-zinc-500 dark:border-zinc-600/50 dark:bg-zinc-800/50 dark:text-zinc-500",
};

function StageBlock({ stage }: { stage: PipelineStage }) {
  const style = BLOCK_STYLES[stage.status];
  return (
    <div
      className={`flex min-w-0 flex-col rounded border px-2 py-1.5 ${style}`}
      aria-label={`${stage.label}: ${stage.status}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-90">{stage.label}</span>
      {stage.detail && stage.detail !== "—" && (
        <span className="mt-0.5 truncate text-[10px] opacity-80" title={stage.detail}>
          {stage.detail}
        </span>
      )}
    </div>
  );
}

export default function ExecutionTimeline() {
  const { traceIdFromUrl, traceData, loading } = useTraceContext();

  const stages = useMemo(() => {
    if (!traceData?.events?.length) return [];
    return buildPipelineStages(
      traceData.events,
      traceData.policyDecisions,
      traceData.actions ?? []
    );
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

  if (!traceIdFromUrl || !traceData) {
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
