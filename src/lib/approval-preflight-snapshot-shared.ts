/**
 * Approval-time preflight snapshot — wire format from UI and persisted record shape.
 * Pure helpers only (safe for client import).
 */

import { getRiskLevel, type RiskLevel } from "@/lib/risk";

export type ApprovalPreflightReadiness = "ready" | "will_block" | "unknown";

/** Slim reason row persisted at approval time (no duplicate full event payload). */
export type ApprovalPreflightReasonDetailWire = {
  code: string;
  label: string;
  summary: string;
  /** Optional policy / rule id when known (e.g. from future UI). */
  rule?: string;
};

/**
 * Payload POSTed with approve — server assigns id, approvalId, traceId, capturedAt.
 */
export type ApprovalPreflightSnapshotWire = {
  kind: string;
  riskLevel: RiskLevel;
  readiness: ApprovalPreflightReadiness;
  reasonDetails: ApprovalPreflightReasonDetailWire[];
  expectedOutputs: string[];
  notes?: string[];
};

export type ApprovalPreflightSnapshotRecord = ApprovalPreflightSnapshotWire & {
  id: string;
  approvalId: string;
  traceId: string;
  capturedAt: string;
};

const MAX_REASON_DETAILS = 20;
const MAX_EXPECTED_OUTPUTS = 30;
const MAX_NOTES = 10;
const MAX_CODE_LEN = 64;
const MAX_LABEL_LEN = 200;
const MAX_SUMMARY_LEN = 2000;
const MAX_RULE_LEN = 200;
const MAX_OUTPUT_LEN = 500;
const MAX_NOTE_LEN = 2000;
const MAX_KIND_LEN = 128;

function trimStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function normalizeReasonDetail(
  raw: unknown
): ApprovalPreflightReasonDetailWire | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const code = trimStr(o.code, MAX_CODE_LEN);
  const label = trimStr(o.label, MAX_LABEL_LEN);
  const summary = trimStr(o.summary, MAX_SUMMARY_LEN);
  if (!code || !label || !summary) return null;
  const ruleRaw = o.rule;
  const rule =
    typeof ruleRaw === "string" && ruleRaw.trim()
      ? trimStr(ruleRaw, MAX_RULE_LEN)
      : undefined;
  return rule ? { code, label, summary, rule } : { code, label, summary };
}

/**
 * Validates client wire; enforces kind match and size caps. Returns normalized wire.
 */
export function validateApprovalPreflightSnapshotWire(
  body: unknown,
  expectedKind: string
): { ok: true; wire: ApprovalPreflightSnapshotWire } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "approvalPreflightSnapshot must be an object" };
  }
  const o = body as Record<string, unknown>;
  const kind = trimStr(o.kind, MAX_KIND_LEN);
  if (!kind || kind !== expectedKind) {
    return { ok: false, error: "approvalPreflightSnapshot.kind must match proposal kind" };
  }
  const riskLevel = o.riskLevel;
  if (riskLevel !== "low" && riskLevel !== "medium" && riskLevel !== "high") {
    return { ok: false, error: "approvalPreflightSnapshot.riskLevel invalid" };
  }
  const readiness = o.readiness;
  if (readiness !== "ready" && readiness !== "will_block" && readiness !== "unknown") {
    return { ok: false, error: "approvalPreflightSnapshot.readiness invalid" };
  }
  const rdRaw = o.reasonDetails;
  if (!Array.isArray(rdRaw)) {
    return { ok: false, error: "approvalPreflightSnapshot.reasonDetails must be an array" };
  }
  const reasonDetails: ApprovalPreflightReasonDetailWire[] = [];
  for (const item of rdRaw.slice(0, MAX_REASON_DETAILS)) {
    const n = normalizeReasonDetail(item);
    if (n) reasonDetails.push(n);
  }
  const eoRaw = o.expectedOutputs;
  if (!Array.isArray(eoRaw)) {
    return { ok: false, error: "approvalPreflightSnapshot.expectedOutputs must be an array" };
  }
  const expectedOutputs = eoRaw
    .slice(0, MAX_EXPECTED_OUTPUTS)
    .map((x) => trimStr(x, MAX_OUTPUT_LEN))
    .filter(Boolean);
  let notes: string[] | undefined;
  if (o.notes !== undefined) {
    if (!Array.isArray(o.notes)) {
      return { ok: false, error: "approvalPreflightSnapshot.notes must be an array when set" };
    }
    notes = o.notes
      .slice(0, MAX_NOTES)
      .map((x) => trimStr(x, MAX_NOTE_LEN))
      .filter(Boolean);
    if (notes.length === 0) notes = undefined;
  }
  return {
    ok: true,
    wire: {
      kind,
      riskLevel,
      readiness,
      reasonDetails,
      expectedOutputs,
      notes,
    },
  };
}

/** UI preflight shape (matches /api/preflight JSON). */
export type PreflightDataForSnapshot = {
  kind: string;
  status: "ready" | "will_block";
  riskLevel: RiskLevel;
  expectedOutputs: string[];
  preflight: {
    willBlock: boolean;
    reasons: string[];
    reasonDetails: { code: string; label: string; summary: string }[];
    notes: string[];
  };
};

/**
 * Build the exact wire the operator saw (or explicit unknown) from modal preflight state.
 */
export function buildApprovalPreflightSnapshotWire(input: {
  kind: string;
  preflight: PreflightDataForSnapshot | null;
  preflightLoading: boolean;
}): ApprovalPreflightSnapshotWire {
  const { kind, preflight, preflightLoading } = input;
  if (preflightLoading || !preflight) {
    return {
      kind,
      riskLevel: preflight?.riskLevel ?? getRiskLevel(kind),
      readiness: "unknown",
      reasonDetails: [],
      expectedOutputs: preflight?.expectedOutputs?.length ? [...preflight.expectedOutputs] : [],
      notes: preflightLoading
        ? ["Preflight was still loading when Approve was clicked."]
        : ["Preflight did not complete before Approve; readiness unknown at approval time."],
    };
  }
  return {
    kind: preflight.kind,
    riskLevel: preflight.riskLevel,
    readiness: preflight.status === "will_block" ? "will_block" : "ready",
    reasonDetails: preflight.preflight.reasonDetails.map((d) => ({
      code: d.code,
      label: d.label,
      summary: d.summary,
    })),
    expectedOutputs: [...preflight.expectedOutputs],
    notes: preflight.preflight.notes.length > 0 ? [...preflight.preflight.notes] : undefined,
  };
}

export function approvalPreflightSnapshotBlockerLine(
  s: Pick<ApprovalPreflightSnapshotRecord, "reasonDetails" | "readiness">
): string {
  const d = s.reasonDetails[0];
  if (d) return `${d.label}: ${d.summary}`;
  if (s.readiness === "unknown") return "Readiness was unknown at approval time.";
  return "No reason details were recorded in the snapshot.";
}
