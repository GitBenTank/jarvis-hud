import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { promises as fs } from "node:fs";
import {
  getDateKey,
  getEventsFilePath,
  getActionsFilePath,
  getPolicyDecisionsFilePath,
  readJson,
} from "@/lib/storage";
import { normalizeAction } from "@/lib/normalize";
import type { ActivityEvent } from "@/lib/activity-types";
import { buildRuntimePosture } from "@/lib/runtime-posture";
import { getReasonDetail, reasonFromPolicyReason, type ReasonDetail } from "@/lib/reason-taxonomy";

type StoredEvent = {
  id: string;
  traceId?: string;
  type?: string;
  agent?: string;
  payload?: unknown;
  status?: string;
  createdAt?: string;
  executed?: boolean;
  executedAt?: string;
  approvedAt?: string;
  proposalStatus?: string;
};

type ActionLogEntry = {
  id: string;
  traceId?: string;
  at: string;
  kind: string;
  approvalId: string;
  status: string;
  summary?: string;
  reasonDetails?: ReasonDetail[];
};

async function readActionLogChronological(dateKey: string): Promise<ActionLogEntry[]> {
  const filePath = getActionsFilePath(dateKey);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => JSON.parse(line) as ActionLogEntry);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

type PolicyDecisionEntry = {
  traceId: string;
  decision: "allow" | "deny";
  rule: string;
  reason: string;
  timestamp: string;
};

async function readPolicyDecisionsChronological(dateKey: string): Promise<PolicyDecisionEntry[]> {
  const filePath = getPolicyDecisionsFilePath(dateKey);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => JSON.parse(line) as PolicyDecisionEntry);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

function toActivityEvents(
  events: StoredEvent[],
  actions: ActionLogEntry[],
  policyDecisions: PolicyDecisionEntry[]
): ActivityEvent[] {
  const out: ActivityEvent[] = [];

  for (const e of events) {
    const traceId = e.traceId ?? e.id;
    const agent = e.agent ?? "openclaw";
    const kind = e.payload ? normalizeAction(e.payload).kind : undefined;
    const connector = (e as { source?: { connector?: string; verified?: boolean } }).source?.connector ?? agent;
    const sourceVerified = !!(e as { source?: { verified?: boolean } }).source?.verified;
    const baseId = `${traceId}-${e.id}`;

    out.push({
      id: `${baseId}-proposal`,
      traceId,
      timestamp: e.createdAt ?? new Date().toISOString(),
      actor: agent,
      type: "proposal_received",
      status: "done",
      verb: "Proposed",
      label: "Proposal received",
      summary: `${connector} proposed ${kind ?? "action"}.`,
      approvalId: e.id,
      kind,
    });

    if (sourceVerified) {
      out.push({
        id: `${baseId}-ingress-verified`,
        traceId,
        timestamp: e.createdAt ?? new Date().toISOString(),
        actor: "jarvis",
        type: "ingress_verified",
        status: "done",
        verb: "Recorded",
        label: "Ingress verified",
        summary: `Jarvis verified ingress for ${connector}.`,
        approvalId: e.id,
        kind,
      });
    }

    if (e.status === "pending" && !e.approvedAt && !e.executedAt) {
      out.push({
        id: `${baseId}-awaiting-approval`,
        traceId,
        timestamp: e.createdAt ?? new Date().toISOString(),
        actor: "jarvis",
        type: "awaiting_approval",
        status: "active",
        verb: "Waiting",
        label: "Awaiting approval",
        summary: "Waiting for explicit human approval before execution.",
        reason: getReasonDetail("APPROVAL_REQUIRED"),
        approvalId: e.id,
        kind,
      });
    }

    if (e.approvedAt) {
      out.push({
        id: `${baseId}-approved`,
        traceId,
        timestamp: e.approvedAt,
        actor: "human",
        type: "approved",
        status: "approved",
        verb: "Approved",
        label: "Approved",
        summary: "Operator approved proposal for execution.",
        approvalId: e.id,
        kind,
      });
    }

    const rejectedAt = (e as { rejectedAt?: string }).rejectedAt;
    if (rejectedAt) {
      out.push({
        id: `${baseId}-rejected`,
        traceId,
        timestamp: rejectedAt,
        actor: "human",
        type: "rejected",
        status: "blocked",
        verb: "Blocked",
        label: "Rejected",
        summary: "Operator rejected proposal.",
        reason: getReasonDetail("APPROVAL_REQUIRED"),
        approvalId: e.id,
        kind,
      });
    }

    if (e.approvedAt && !e.executedAt) {
      out.push({
        id: `${baseId}-execution-started`,
        traceId,
        timestamp: e.approvedAt,
        actor: "jarvis",
        type: "execution_started",
        status: "active",
        verb: "Waiting",
        label: "Execution started",
        summary: "Jarvis queued execution after approval.",
        approvalId: e.id,
        kind,
      });
    }

    if (e.executedAt) {
      out.push({
        id: `${baseId}-execution-completed`,
        traceId,
        timestamp: e.executedAt,
        actor: "jarvis",
        type: "execution_completed",
        status: "success",
        verb: "Executed",
        label: "Execution completed",
        summary: `Execution completed for ${kind ?? "action"}.`,
        approvalId: e.id,
        kind,
      });
    }
  }

  for (const p of policyDecisions) {
    const denied = p.decision === "deny";
    out.push({
      id: `${p.traceId}-${p.timestamp}-${p.decision}`,
      traceId: p.traceId,
      timestamp: p.timestamp,
      actor: "jarvis",
      type: denied ? "policy_blocked" : "policy_allowed",
      status: denied ? "blocked" : "done",
      verb: denied ? "Blocked" : "Approved",
      label: denied ? "Policy blocked" : "Policy allowed",
      summary: denied
        ? `Policy blocked execution (${p.rule}).`
        : `Policy allowed execution (${p.rule}).`,
      reason: denied ? reasonFromPolicyReason(p.reason) : undefined,
    });
  }

  for (const a of actions) {
    const traceId = a.traceId ?? "";
    if (!traceId) continue;

    const blocked = a.status === "blocked";
    const failed = a.status === "failed";
    const firstReason = a.reasonDetails?.[0];
    out.push({
      id: `${traceId}-${a.id}-receipt`,
      traceId,
      timestamp: a.at,
      actor: "jarvis",
      type: "receipt_written",
      status: a.status,
      verb: "Recorded",
      label: "Receipt written",
      summary: a.summary || `Receipt recorded for ${a.kind}.`,
      reason: firstReason,
      approvalId: a.approvalId,
      kind: a.kind,
    });

    if (blocked || failed) {
      out.push({
        id: `${traceId}-${a.id}-execution-${a.status}`,
        traceId,
        timestamp: a.at,
        actor: "jarvis",
        type: "execution_failed",
        status: blocked ? "blocked" : "failed",
        verb: "Blocked",
        label: blocked ? "Execution blocked" : "Execution failed",
        summary: blocked
          ? `Execution blocked for ${a.kind}.`
          : `Execution failed for ${a.kind}.`,
        reason: firstReason ?? getReasonDetail("POLICY_DENIED"),
        approvalId: a.approvalId,
        kind: a.kind,
      });
    }
  }

  return out;
}

export async function GET(request: Request) {
  try {
    const dateKey = getDateKey();
    const events = (await readJson<StoredEvent[]>(getEventsFilePath(dateKey))) ?? [];
    const actions = await readActionLogChronological(dateKey);
    const policyDecisions = await readPolicyDecisionsChronological(dateKey);

    const activityEvents = toActivityEvents(events, actions, policyDecisions);
    activityEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const includePosture =
      new URL(request.url).searchParams.get("includePosture") === "1";
    if (!includePosture) {
      return NextResponse.json(activityEvents);
    }

    const runtimePosture = buildRuntimePosture({
      events,
      actions,
      authEnabled: false,
      ingressEnabled: false,
      safetyOn: true,
      mode: "dry-run",
    });

    return NextResponse.json({
      events: activityEvents,
      runtimePosture,
    });
  } catch (err) {
    console.error("[activity/stream]", (err as Error)?.message);
    return NextResponse.json(
      { error: "Failed to load activity stream" },
      { status: 500 }
    );
  }
}
