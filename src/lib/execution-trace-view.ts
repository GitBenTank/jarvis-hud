/**
 * Read-only view model for trace / replay UI — built only from `TraceReplayResult`
 * (see `assembleTraceReplay` in trace-replay.ts). No persistence or schema changes.
 */

import type { TraceReplayResult } from "./trace-replay";

export type ExecutionTraceBandTone = "success" | "warning" | "error" | "pending" | "neutral";

export type ExecutionTraceStep = {
  id: string;
  label: string;
  detail?: string;
  actor?: string;
  tone: "done" | "pending" | "blocked" | "neutral";
};

export type ExecutionTraceViewModel = {
  headline: string;
  band: { label: string; tone: ExecutionTraceBandTone };
  steps: ExecutionTraceStep[];
  resultSummary: string;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function formatShortTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function receiptStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("fail") || s === "error") return "Failed";
  if (s.includes("deny")) return "Blocked";
  if (s.includes("executed") || s.includes("written") || s === "success" || s === "ok")
    return "Executed";
  return "Result";
}

function receiptStepTone(status: string): ExecutionTraceStep["tone"] {
  const s = status.toLowerCase();
  if (s.includes("fail") || s === "error" || s.includes("deny")) return "blocked";
  if (s.includes("pending") || s.includes("wait")) return "pending";
  return "done";
}

function overallBand(replay: TraceReplayResult): { label: string; tone: ExecutionTraceBandTone } {
  const approval = asRecord(replay.approval);
  const lastPolicy = replay.policyDecisions.at(-1);
  const latest = replay.receipts.at(-1);

  if (lastPolicy?.decision === "deny") {
    return { label: "Blocked by policy", tone: "error" };
  }
  if (str(approval?.rejectedAt)) {
    return { label: "Rejected", tone: "warning" };
  }
  if (str(approval?.failedAt) && !approval?.executed) {
    return { label: "Execution failed", tone: "error" };
  }
  if (latest) {
    const t = receiptStepTone(latest.status);
    if (t === "blocked") return { label: "Failed or blocked", tone: "error" };
    if (t === "pending") return { label: "In progress", tone: "pending" };
    return { label: "Complete", tone: "success" };
  }
  if (str(approval?.approvedAt) || approval?.executed === true) {
    return { label: "Awaiting receipt", tone: "pending" };
  }
  return { label: "Awaiting approval", tone: "pending" };
}

/**
 * Compose a single readable story from `assembleTraceReplay` output.
 * Uses only fields present on `TraceReplayResult`; no invented storage.
 */
export function buildExecutionTraceView(
  replay: TraceReplayResult | null
): ExecutionTraceViewModel | null {
  if (!replay) return null;
  if (!replay.proposal && replay.receipts.length === 0) return null;

  const proposal = asRecord(replay.proposal);
  const approval = asRecord(replay.approval);
  const execution = replay.execution ? asRecord(replay.execution) : null;

  const kind = str(proposal?.kind) ?? "unknown";
  const summary = str(proposal?.summary) ?? str(proposal?.title) ?? "—";
  const source = proposal?.source ? asRecord(proposal.source) : null;
  const connector = str(source?.connector);
  const agentActor = connector ? `Agent (${connector})` : "Agent";

  const steps: ExecutionTraceStep[] = [];

  if (proposal) {
    steps.push({
      id: "proposed",
      label: "Proposed",
      detail: `${kind} · ${summary}`,
      actor: agentActor,
      tone: "done",
    });
  } else {
    steps.push({
      id: "proposed",
      label: "Proposed",
      detail: "Not in replay window (events missing); receipts may still show below.",
      actor: agentActor,
      tone: "neutral",
    });
  }

  replay.policyDecisions.forEach((pd, i) => {
    steps.push({
      id: `policy-${i}-${pd.timestamp}`,
      label: pd.decision === "allow" ? "Policy · allow" : "Policy · deny",
      detail: `${pd.rule}: ${pd.reason}`,
      actor: "Policy",
      tone: pd.decision === "allow" ? "done" : "blocked",
    });
  });

  const rejectedAt = str(approval?.rejectedAt);
  const approvedAt = str(approval?.approvedAt);
  const executed = approval?.executed === true;

  if (rejectedAt) {
    steps.push({
      id: "rejected",
      label: "Rejected",
      detail: formatShortTime(rejectedAt),
      actor: "Human",
      tone: "blocked",
    });
  } else if (approvedAt || executed) {
    steps.push({
      id: "approved",
      label: "Approved",
      detail: approvedAt ? formatShortTime(approvedAt) : executed ? "Recorded as executed" : "—",
      actor: "Human",
      tone: "done",
    });
  } else if (approval || proposal) {
    steps.push({
      id: "approval",
      label: "Approval",
      detail: "Awaiting human decision",
      actor: "Human",
      tone: "pending",
    });
  }

  const latest = replay.receipts.at(-1);
  if (latest) {
    const execKind = str(execution?.kind) ?? latest.kind;
    const at = str(execution?.at) ?? latest.at;
    steps.push({
      id: "execution",
      label: receiptStatusLabel(latest.status),
      detail: `${execKind} · ${latest.summary || latest.status} · ${formatShortTime(at)}`,
      actor: "Execution",
      tone: receiptStepTone(latest.status),
    });
  } else if (!rejectedAt && (approvedAt || approval)) {
    steps.push({
      id: "execution",
      label: "Executed",
      detail: "No receipt in replay window yet",
      actor: "Execution",
      tone: "pending",
    });
  }

  const lastRecon = replay.reconciliation.at(-1);
  if (lastRecon) {
    const label =
      lastRecon.status === "verified"
        ? "Reconciliation · verified"
        : lastRecon.status === "drift_detected"
          ? "Reconciliation · drift"
          : "Reconciliation · pending";
    steps.push({
      id: "reconciliation",
      label,
      detail: lastRecon.reason || "—",
      actor: "Controller",
      tone:
        lastRecon.status === "drift_detected"
          ? "blocked"
          : lastRecon.status === "verified"
            ? "done"
            : "neutral",
    });
  }

  const band = overallBand(replay);
  const headline =
    proposal && summary !== "—"
      ? `${kind}: ${summary.length > 72 ? `${summary.slice(0, 72)}…` : summary}`
      : `Trace ${replay.traceId.slice(0, 8)}…`;

  let resultSummary: string;
  if (latest) {
    resultSummary = `${receiptStatusLabel(latest.status)} — ${latest.summary || latest.status}`;
  } else if (rejectedAt) {
    resultSummary = "Rejected before execution.";
  } else if (str(approval?.failedAt)) {
    resultSummary = "Execution failed (see approval record); no receipt in replay.";
  } else if (replay.policyDecisions.some((p) => p.decision === "deny")) {
    resultSummary = "Blocked by policy; execution did not proceed.";
  } else {
    resultSummary = "No final receipt in this replay.";
  }

  return { headline, band, steps, resultSummary };
}
