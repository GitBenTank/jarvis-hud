"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeAction } from "@/lib/normalize";
import {
  isApprovedAwaitingExecution,
  isExecuted,
  isPendingApproval,
  normalizeProposalLifecycle,
  type ProposalStatus,
} from "@/lib/proposal-lifecycle";
import { getProposalBatchItemContextFromEvent } from "@/lib/proposal-batch";
import {
  requiresIrreversibleConfirmation,
  getConfirmationPhrase,
} from "@/lib/risk";
import { isRecoveryClass } from "@/lib/recovery-shared";
import AgentProposalsFeed from "./AgentProposalsFeed";
import ApprovalSafetySection from "./ApprovalSafetySection";
import ApprovalTimePreflightSnapshotSection from "./ApprovalTimePreflightSnapshotSection";
import Badge from "./Badge";
import {
  buildApprovalPreflightSnapshotWire,
  type ApprovalPreflightSnapshotRecord,
  type ApprovalPreflightSnapshotWire,
} from "@/lib/approval-preflight-snapshot-shared";
import { buildDecisionReplayLine, firstPreflightBlockerLine } from "@/lib/decision-replay";
import type { ReasonDetail } from "@/lib/reason-taxonomy";

type Event = {
  id: string;
  traceId?: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
  proposalStatus?: ProposalStatus;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  source?: {
    connector: string;
    verified?: boolean;
    receivedAt?: string;
    nonce?: string;
    timestamp?: string;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  correlationId?: string;
  trustedIngress?: { ok: boolean; reasons?: string[] };
  approvalActorId?: string;
  approvalActorType?: "human" | "agent";
  approvalActorLabel?: string;
  rejectionActorId?: string;
  rejectionActorType?: "human" | "agent";
  rejectionActorLabel?: string;
  /** OpenClaw builder agent label (e.g. forge); optional metadata. */
  builder?: string;
  provider?: string;
  model?: string;
  /** Review-container metadata (ADR-0005); each event still has its own execute receipt. */
  batch?: unknown;
};

type ApprovalsResponse = {
  dateKey: string;
  approvals: Event[];
};

type ExecuteResult = {
  ok: boolean;
  approvalId: string;
  executedAt: string;
  kind: string;
  artifactPath?: string | null;
  outputPath?: string | null;
  dryRun: boolean;
  readyForUpload?: boolean;
  videoFilePath?: string | null;
  tagsCount?: number;
  commitHash?: string | null;
  rollbackCommand?: string | null;
  noChangesApplied?: boolean;
  providerMessageId?: string;
  emailDestination?: string;
};

type ExecuteError = {
  approvalId: string;
  error: string;
  reasons?: string[];
  reasonDetails?: ReasonDetail[];
  stepUpRequired?: boolean;
};

type PreflightData = {
  kind: string;
  status: "ready" | "will_block";
  riskLevel: "low" | "medium" | "high";
  expectedOutputs: string[];
  preflight: {
    willBlock: boolean;
    reasons: string[];
    reasonDetails: ReasonDetail[];
    notes: string[];
  };
};

function getYoutubeTagCount(payload: unknown): number | null {
  const p = payload as Record<string, unknown>;
  const yt = p?.youtube as Record<string, unknown> | undefined;
  const tagsStr = typeof yt?.tags === "string" ? yt.tags : null;
  if (!tagsStr) return null;
  const count = tagsStr
    .split(/[\s,]+/)
    .map((t: string) => t.trim())
    .filter(Boolean).length;
  return count;
}

function proposalStatusToVariant(
  s: ProposalStatus
): "pending" | "approved" | "executed" | "rejected" | "failed" | "executing" {
  if (s === "executed") return "executed";
  if (s === "executing") return "executing";
  if (s === "approved") return "approved";
  if (s === "rejected" || s === "failed") return s;
  return "pending";
}

function proposalStatusToLabel(s: ProposalStatus): string {
  const labels: Record<ProposalStatus, string> = {
    proposed: "PROPOSED",
    validated: "VALIDATED",
    pending_approval: "PENDING",
    approved: "APPROVED",
    executing: "EXECUTING",
    executed: "EXECUTED",
    rejected: "REJECTED",
    failed: "FAILED",
    archived: "ARCHIVED",
  };
  return labels[s] ?? s.toUpperCase();
}

function LifecycleStatusBadge({ event }: { event: Event }) {
  const n = normalizeProposalLifecycle(event);
  return <Badge variant={proposalStatusToVariant(n.proposalStatus)}>{proposalStatusToLabel(n.proposalStatus)}</Badge>;
}

function LifecycleTimestamps({ event }: { event: Event }) {
  const n = normalizeProposalLifecycle(event);
  return (
    <>
      <div>
        <dt className="font-medium text-zinc-500">Created</dt>
        <dd>{n.createdAt}</dd>
      </div>
      {n.approvedAt && (
        <div>
          <dt className="font-medium text-zinc-500">Approved</dt>
          <dd>{n.approvedAt}</dd>
        </div>
      )}
      {n.executedAt && (
        <div>
          <dt className="font-medium text-zinc-500">Executed successfully</dt>
          <dd>{n.executedAt}</dd>
        </div>
      )}
    </>
  );
}

type DetailModalProps = Readonly<{
  event: Event;
  onClose: () => void;
  onApprove: (id: string, approvalPreflightSnapshotWire?: ApprovalPreflightSnapshotWire) => void;
  onDeny: (id: string) => void;
  onExecute: (id: string) => void;
  onCreateReflection?: (result: ExecuteResult) => void;
  executeResult: ExecuteResult | null;
  executeError: ExecuteError | null;
  executeLoading: boolean;
  irreversibleConfirmEnabled: boolean;
  /** Events list date key (speeds snapshot lookup). */
  listDateKey: string;
}>;

function DetailModal({
  event,
  onClose,
  onApprove,
  onDeny,
  onExecute,
  onCreateReflection,
  executeResult,
  executeError,
  executeLoading,
  irreversibleConfirmEnabled,
  listDateKey,
}: DetailModalProps) {
  const normalized = normalizeAction(event.payload);
  const [preflight, setPreflight] = useState<PreflightData | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [persistedSnapshot, setPersistedSnapshot] =
    useState<ApprovalPreflightSnapshotRecord | null>(null);
  const [persistedSnapshotLoading, setPersistedSnapshotLoading] = useState(false);
  const needsTypedApprovalGate =
    irreversibleConfirmEnabled &&
    requiresIrreversibleConfirmation(normalized.kind) &&
    event.status === "pending";
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const phrase = getConfirmationPhrase(normalized.kind);
  const approvalReady =
    !needsTypedApprovalGate || (confirmCheckbox && confirmPhrase.trim() === phrase);
  const executeWillBlock = preflight?.preflight.willBlock === true;
  const executeDisabledByReadiness = preflightLoading || executeWillBlock;
  const executeButtonDisabled = executeLoading || executeDisabledByReadiness;

  const decisionReplayLine = useMemo(
    () =>
      buildDecisionReplayLine({
        proposerLabel: event.agent?.trim() || "Unknown proposer",
        kind: normalized.kind,
        eventStatus: event.status,
        rejectedAt: event.rejectedAt,
        approvedAt: event.approvedAt,
        executed: event.executed === true,
        failedAt: event.failedAt,
        approvalActorLabel: event.approvalActorLabel,
        approvalActorId: event.approvalActorId,
        rejectionActorLabel: event.rejectionActorLabel,
        rejectionActorId: event.rejectionActorId,
        sessionExecuteSucceeded:
          executeResult?.ok === true && executeResult.approvalId === event.id,
        preflight: { loading: preflightLoading, data: preflight },
        executionOutcome: null,
      }),
    [
      event.agent,
      event.status,
      event.rejectedAt,
      event.approvedAt,
      event.executed,
      event.failedAt,
      event.approvalActorLabel,
      event.approvalActorId,
      event.rejectionActorLabel,
      event.rejectionActorId,
      event.id,
      normalized.kind,
      executeResult?.ok,
      executeResult?.approvalId,
      preflightLoading,
      preflight,
    ]
  );

  useEffect(() => {
    queueMicrotask(() => {
      setConfirmCheckbox(false);
      setConfirmPhrase("");
    });
  }, [event.id]);

  const showPersistedApprovalSnapshot =
    event.requiresApproval === true && event.status !== "pending";

  useEffect(() => {
    if (!showPersistedApprovalSnapshot) {
      setPersistedSnapshot(null);
      setPersistedSnapshotLoading(false);
      return;
    }
    let cancelled = false;
    setPersistedSnapshotLoading(true);
    const q =
      listDateKey.trim() !== ""
        ? `?dateKey=${encodeURIComponent(listDateKey)}`
        : "";
    fetch(`/api/approvals/${event.id}/preflight-snapshot${q}`)
      .then((r) => r.json())
      .then((j: { snapshot?: ApprovalPreflightSnapshotRecord | null }) => {
        if (!cancelled) setPersistedSnapshot(j.snapshot ?? null);
      })
      .catch(() => {
        if (!cancelled) setPersistedSnapshot(null);
      })
      .finally(() => {
        if (!cancelled) setPersistedSnapshotLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [event.id, listDateKey, showPersistedApprovalSnapshot]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setPreflightLoading(true);
      try {
        const res = await fetch("/api/preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ kind: normalized.kind }),
        });
        const json = await res.json();
        if (!cancelled && res.ok) setPreflight(json as PreflightData);
        if (!cancelled && !res.ok) setPreflight(null);
      } catch {
        if (!cancelled) setPreflight(null);
      } finally {
        if (!cancelled) setPreflightLoading(false);
      }
    };
    queueMicrotask(run);
    return () => {
      cancelled = true;
    };
  }, [normalized.kind]);
  const isPublish = normalized.kind === "content.publish";
  const isReflection = normalized.kind === "reflection.note";
  const isSystemNote = normalized.kind === "system.note";
  const isSendEmail = normalized.kind === "send_email";
  const isCodeDiff = normalized.kind === "code.diff";
  const isCodeApply = normalized.kind === "code.apply";
  const isRecovery = isRecoveryClass(normalized.kind);
  const isYouTube = isPublish && normalized.channel === "youtube";
  const isExecutable =
    isPublish ||
    isReflection ||
    isSystemNote ||
    isSendEmail ||
    isCodeDiff ||
    isCodeApply ||
    isRecovery;
  const blockedForEvent = executeError?.approvalId === event.id;
  const youtubeTagCount = isYouTube ? getYoutubeTagCount(event.payload) : null;
  const batchCtx = getProposalBatchItemContextFromEvent(event);

  const executeButtonLabel = (() => {
    if (executeLoading) return "Executing…";
    if (executeWillBlock) return "Execution blocked — fix preflight issues";
    if (preflightLoading) return "Checking execution readiness…";
    if (isReflection) return "Execute";
    if (isCodeApply) return "Execute (git commit)";
    if (isSendEmail) return "Execute (send email)";
    return "Execute (dry run)";
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Approval details</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            ×
          </button>
        </div>

        {event.status === "pending" && (
          <p className="mb-3 rounded border border-blue-200 bg-blue-50/90 px-3 py-2 text-xs leading-relaxed text-zinc-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-zinc-200">
            <span className="font-semibold text-zinc-700 dark:text-zinc-100">Next steps: </span>
            Approve only records your decision. If you approve, you will still need to click{" "}
            <strong>Execute</strong> separately to run the action and write receipts — approval does not run the
            adapter.
          </p>
        )}
        {event.status === "approved" && !event.executed && (
          <p className="mb-3 rounded border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-zinc-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-zinc-200">
            <span className="font-semibold text-zinc-700 dark:text-emerald-200">Next step: </span>
            Approval is recorded. Use <strong>Execute</strong> below to run policy checks, perform the action, and write
            artifacts plus the action log.
          </p>
        )}

        <p
          className="mb-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-200"
          aria-live="polite"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Decision replay ·
          </span>{" "}
          {decisionReplayLine}
        </p>

        {showPersistedApprovalSnapshot ? (
          <ApprovalTimePreflightSnapshotSection
            snapshot={persistedSnapshot}
            loading={persistedSnapshotLoading}
          />
        ) : null}

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-zinc-500">Proposal id</dt>
            <dd>
              <code className="break-all font-mono text-xs">{event.id}</code>
            </dd>
          </div>
          {event.traceId ? (
            <div>
              <dt className="font-medium text-zinc-500">Trace id</dt>
              <dd>
                <code className="break-all font-mono text-xs">{event.traceId}</code>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-zinc-500">Type</dt>
            <dd>{event.type}</dd>
          </div>
          {event.source?.connector === "openclaw" && (
            <div>
              <dt className="font-medium text-zinc-500">Source</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-zinc-400 px-2 py-0.5 text-xs font-medium">
                  OpenClaw{event.source.verified ? " (verified)" : ""}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    event.trustedIngress?.ok
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  Ingress: {event.trustedIngress?.ok ? "passed" : "failed"}
                </span>
              </dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-zinc-500">Status</dt>
            <dd>
              <LifecycleStatusBadge event={event} />
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Coordinator</dt>
            <dd>{event.agent}</dd>
          </div>
          {event.builder?.trim() ? (
            <div>
              <dt className="font-medium text-zinc-500">Builder</dt>
              <dd>{event.builder.trim()}</dd>
            </div>
          ) : null}
          {event.provider?.trim() ? (
            <div>
              <dt className="font-medium text-zinc-500">Provider</dt>
              <dd>{event.provider.trim()}</dd>
            </div>
          ) : null}
          {event.model?.trim() ? (
            <div>
              <dt className="font-medium text-zinc-500">Model</dt>
              <dd className="break-all font-mono text-xs">{event.model.trim()}</dd>
            </div>
          ) : null}
          {batchCtx ? (
            <div className="rounded border border-violet-200 bg-violet-50/80 px-3 py-2 dark:border-violet-800/60 dark:bg-violet-950/35">
              <div className="text-sm font-medium text-violet-800 dark:text-violet-200">
                Review container (batch)
              </div>
              <div className="mt-1 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                <div>
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">Batch id:</span>{" "}
                  <code className="font-mono">{batchCtx.id}</code>
                </div>
                <div>
                  Item {batchCtx.itemIndex + 1} of {batchCtx.itemCount} · approval and execution apply to{" "}
                  <strong>this</strong> item only; receipts are per item.
                </div>
                {batchCtx.title ? (
                  <div>
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">Title:</span> {batchCtx.title}
                  </div>
                ) : null}
                {batchCtx.summary ? (
                  <div className="text-zinc-600 dark:text-zinc-400">{batchCtx.summary}</div>
                ) : null}
              </div>
            </div>
          ) : null}
          <LifecycleTimestamps event={event} />
        </dl>

        {/* Request metadata — correlationId, source metadata (detailed view only) */}
        {(event.correlationId ||
          event.source?.sessionId ||
          event.source?.agentId ||
          event.source?.requestId) && (
          <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800">
            <div className="font-medium text-zinc-600 dark:text-zinc-400">Request metadata</div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-zinc-600 dark:text-zinc-400">
              {event.correlationId && (
                <span>
                  correlationId: <code className="font-mono">{event.correlationId}</code>
                </span>
              )}
              {event.source?.sessionId && (
                <span>sessionId: <code className="font-mono">{event.source.sessionId}</code></span>
              )}
              {event.source?.agentId && (
                <span>agentId: <code className="font-mono">{event.source.agentId}</code></span>
              )}
              {event.source?.requestId && (
                <span>requestId: <code className="font-mono">{event.source.requestId}</code></span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <ApprovalSafetySection
            kind={normalized.kind}
            preflight={preflight}
            preflightLoading={preflightLoading}
            showTypedApprovalGate={needsTypedApprovalGate}
            phrase={phrase}
            confirmCheckbox={confirmCheckbox}
            onConfirmCheckbox={setConfirmCheckbox}
            confirmPhrase={confirmPhrase}
            onConfirmPhrase={setConfirmPhrase}
          />
        </div>

        {(isPublish ||
          isReflection ||
          isSystemNote ||
          isSendEmail ||
          isCodeDiff ||
          isCodeApply ||
          isRecovery) && (
          <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/30">
            <h3 className="font-medium">What happens if you approve?</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
              <li>
                <strong>Approve</strong> = changes status only (no posting)
              </li>
              <li>
                {isRecovery ? (
                  <strong>Execute (runbook)</strong>
                ) : isReflection ? (
                  <strong>Execute</strong>
                ) : isCodeApply ? (
                  <strong>Execute (git commit)</strong>
                ) : isSendEmail ? (
                  <strong>Execute (send email)</strong>
                ) : (
                  <strong>Execute (dry run)</strong>
                )}{" "}
                = {isRecovery
                  ? "writes recovery runbook artifact + action log receipt (no autonomous remediation)"
                  : isReflection
                    ? "writes reflection files + action log receipt"
                    : isCodeApply
                      ? "modifies working tree + creates local git commit + receipts (no pushing)"
                      : isSendEmail
                        ? "sends one allowlisted outbound email + writes receipt JSON + action log entry"
                      : isCodeDiff
                        ? "writes local diff bundle + action log receipt, no changes applied"
                        : "writes artifact to publish-queue + action log, still no posting"}
              </li>
            </ul>
            {isCodeApply && (
              <div className="mt-3 rounded-lg border border-amber-400/50 bg-amber-50/80 py-2 px-3 text-sm dark:border-amber-400/30 dark:bg-amber-950/30">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  This will modify your working tree and create a local git commit. No pushing.
                </p>
              </div>
            )}
            {isSendEmail && (
              <div className="mt-3 rounded-lg border border-amber-400/50 bg-amber-50/80 py-2 px-3 text-sm dark:border-amber-400/30 dark:bg-amber-950/30">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Execute sends a real email to the demo allowlist address only. Requires DEMO_EMAIL_USER and
                  DEMO_EMAIL_PASS on the server.
                </p>
              </div>
            )}
            {isPublish && (
              <div className="mt-3 rounded-lg border border-amber-400/50 bg-amber-50/80 py-2 px-3 text-sm dark:border-amber-400/30 dark:bg-amber-950/30">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  No posting occurs. This action only writes a local package + receipts.
                </p>
              </div>
            )}
          </div>
        )}

        {(isCodeDiff || isCodeApply) ? (
          (() => {
            const p = event.payload as Record<string, unknown>;
            const code = p?.code as Record<string, unknown> | undefined;
            const summary = code && typeof code.summary === "string" ? code.summary : null;
            const diffTextVal =
              (code && typeof code.diffText === "string" ? code.diffText : null) ??
              (typeof p.patch === "string" ? p.patch : null);
            const files = code && Array.isArray(code.files) ? (code.files as string[]) : [];
            return (
              <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  {isCodeApply ? "Code apply preview" : "Code diff preview"}
                  {isCodeApply ? (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                      GIT COMMIT
                    </span>
                  ) : (
                    <Badge variant="dry_run">DRY RUN</Badge>
                  )}
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-zinc-500">Title:</span>{" "}
                    {normalized.title ?? "(untitled)"}
                  </div>
                  {summary && (
                    <div>
                      <span className="font-medium text-zinc-500">Summary:</span>{" "}
                      {summary}
                    </div>
                  )}
                  {files.length > 0 && (
                    <div>
                      <span className="font-medium text-zinc-500">Files:</span>{" "}
                      {files.join(", ")}
                    </div>
                  )}
                  {diffTextVal ? (
                    <div>
                      <span className="font-medium text-zinc-500">Patch (read-only):</span>
                      <pre className="mt-1 max-h-96 overflow-y-auto overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed rounded border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-600 dark:bg-zinc-900">
                        {diffTextVal}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400">
                      No patch provided — do not approve blindly.
                    </p>
                  )}
                </div>
              </div>
            );
          })()
        ) : isPublish ? (
          <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              Content preview
              <Badge variant="dry_run">DRY RUN</Badge>
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-zinc-500">Channel:</span>{" "}
                {normalized.channel ?? "unknown"}
              </div>
              <div>
                <span className="font-medium text-zinc-500">Title:</span>{" "}
                {normalized.title ?? "(untitled)"}
              </div>
              {isYouTube && youtubeTagCount !== null && (
                <div>
                  <span className="font-medium text-zinc-500">Tags:</span>{" "}
                  {youtubeTagCount} (minimum 8)
                </div>
              )}
              <div>
                <span className="font-medium text-zinc-500">Body:</span>
                <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-zinc-100 p-2 dark:bg-zinc-900">
                  {normalized.body ?? ""}
                </pre>
              </div>
            </div>
          </div>
        ) : isReflection ? (
          <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-2 font-medium">Reflection note</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Source: {String((event.payload as Record<string, unknown>)?.sourceKind ?? "unknown")} ·{" "}
              {String((event.payload as Record<string, unknown>)?.sourceApprovalId ?? "")}
            </p>
          </div>
        ) : isSendEmail ? (
          (() => {
            const p = event.payload as Record<string, unknown>;
            const inner =
              p?.payload != null && typeof p.payload === "object" && !Array.isArray(p.payload)
                ? (p.payload as Record<string, unknown>)
                : p;
            const to = typeof inner.to === "string" ? inner.to : "—";
            const subject = typeof inner.subject === "string" ? inner.subject : "—";
            const body = typeof inner.body === "string" ? inner.body : "";
            const preview = body.length > 600 ? `${body.slice(0, 600)}…` : body;
            return (
              <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  Email preview
                  <span className="rounded border border-amber-400/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Live send
                  </span>
                </h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-zinc-500">To</dt>
                    <dd className="break-all font-mono text-xs">{to}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-500">Subject</dt>
                    <dd>{subject}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-500">Body</dt>
                    <dd>
                      <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-900">
                        {preview || "—"}
                      </pre>
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })()
        ) : isRecovery ? (
          <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              Recovery runbook
              <span className="rounded border border-zinc-400 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                {normalized.kind}
              </span>
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-zinc-500">Symptom</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{normalized.symptom || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Suspected cause</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{normalized.suspectedCause || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Recovery action</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{normalized.recoveryAction || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Verification check</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{normalized.verificationCheck || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Fallback if failed</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{normalized.fallbackIfFailed || "—"}</dd>
              </div>
            </dl>
          </div>
        ) : normalized.kind === "unknown" ? (
          <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-900/30">
            No preview content — do not approve blindly.
          </div>
        ) : (
          <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-2 font-medium">Preview</h3>
            <p className="text-sm">{normalized.summary}</p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="mb-1 font-medium text-zinc-500">Payload (raw)</h3>
          <pre className="overflow-x-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>

        {event.status === "pending" && (
          <div className="mt-6 space-y-2">
            {!approvalReady && needsTypedApprovalGate && (
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Complete the typed confirmation in Safety & readiness above to enable Approve.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onDeny(event.id)}
                className="rounded bg-zinc-200 px-4 py-2 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={() =>
                  onApprove(
                    event.id,
                    buildApprovalPreflightSnapshotWire({
                      kind: normalized.kind,
                      preflight,
                      preflightLoading,
                    })
                  )
                }
                disabled={!approvalReady}
                className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Approve
              </button>
            </div>
          </div>
        )}

        {isYouTube && event.status === "approved" && !event.executed && (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Tags: {youtubeTagCount !== null ? `${youtubeTagCount} (minimum 8)` : "not specified (minimum 8)"}
          </div>
        )}

        {blockedForEvent && executeError && (
          <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-900/30">
            <p className="font-medium">Execution blocked</p>
            {executeError.stepUpRequired ? (
              <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                Step-up required — use Step up button in System Status.
              </p>
            ) : (
              <>
                <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
                  {(executeError.reasons ?? [executeError.error]).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {executeError.reasonDetails && executeError.reasonDetails.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {executeError.reasonDetails.map((d) => (
                      <p key={d.code}>
                        {d.label}: {d.summary}
                      </p>
                    ))}
                  </div>
                )}
                {isYouTube && youtubeTagCount !== null && (
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    Tags: {youtubeTagCount} (minimum 8)
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {event.status === "approved" && !event.executed && isExecutable && (
          <div className="mt-6 space-y-3">
            {irreversibleConfirmEnabled && requiresIrreversibleConfirmation(normalized.kind) && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                You already completed typed approval confirmation for this kind. Execute still respects live policy and
                preflight above.
              </p>
            )}
            <div className="rounded border border-zinc-300 bg-zinc-50/80 py-2 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-800/80">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">Execution boundary</p>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                Approval records human consent. Execute writes artifacts and receipts
                {isSendEmail ? " (or sends the allowlisted demo email)." : "."}
              </p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isSendEmail
                ? "Execute sends one outbound email using server SMTP credentials; receipt JSON is written under JARVIS_ROOT."
                : "Execute writes local artifacts + receipts only. It does not post."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3">
              <button
                type="button"
                onClick={() => onExecute(event.id)}
                disabled={executeButtonDisabled}
                className="shrink-0 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {executeButtonLabel}
              </button>
              {preflightLoading && (
                <p className="min-w-0 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Preflight is running — Execute stays disabled until readiness is known.
                </p>
              )}
              {executeWillBlock && preflight && (
                <p className="min-w-0 flex-1 text-sm text-amber-900 dark:text-amber-200">
                  <span className="font-medium">Execution blocked.</span>{" "}
                  {firstPreflightBlockerLine(preflight)}
                </p>
              )}
              {isPublish && <Badge variant="dry_run">DRY RUN</Badge>}
            </div>
          </div>
        )}

        {event.status === "approved" && !event.executed && !isExecutable && (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/30">
            <p className="font-medium">Execution not supported yet</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Only supported kinds (including send_email, system.note, code.apply, …) can be executed when present in
              policy.
            </p>
          </div>
        )}

        {executeResult && executeResult.approvalId === event.id && (
          <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-900/30">
            <p className="font-medium">Executed successfully</p>
            <p className="mt-1 flex items-center gap-2">
              {executeResult.dryRun === true && <Badge variant="dry_run">DRY RUN</Badge>}
            </p>
            {executeResult.kind === "code.diff" && (
              <>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  This wrote a local diff bundle + receipts. No changes were applied.
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <span className="font-medium text-zinc-500">Output path:</span>{" "}
                    <code className="text-xs">{executeResult.outputPath ?? "—"}</code>
                  </div>
                </div>
              </>
            )}
            {executeResult.kind === "code.apply" && (
              <>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {executeResult.noChangesApplied
                    ? "Receipt recorded. No changes were staged; no commit was created."
                    : "Working tree modified and local commit created. No pushing."}
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <span className="font-medium text-zinc-500">Output path:</span>{" "}
                    <code className="text-xs">{executeResult.outputPath ?? "—"}</code>
                  </div>
                  {executeResult.rollbackCommand && (
                    <div>
                      <span className="font-medium text-zinc-500">Rollback:</span>{" "}
                      <code className="text-xs">{executeResult.rollbackCommand}</code>
                    </div>
                  )}
                </div>
              </>
            )}
            {executeResult.kind === "send_email" && (
              <>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Outbound email sent. JSON receipt written under JARVIS_ROOT; action log updated.
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <span className="font-medium text-zinc-500">Destination:</span>{" "}
                    <code className="break-all text-xs">{executeResult.emailDestination ?? "—"}</code>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">Executed at:</span>{" "}
                    <span className="text-xs">{executeResult.executedAt}</span>
                  </div>
                  {executeResult.providerMessageId ? (
                    <div>
                      <span className="font-medium text-zinc-500">Provider message id:</span>{" "}
                      <code className="break-all text-xs">{executeResult.providerMessageId}</code>
                    </div>
                  ) : null}
                  <div>
                    <span className="font-medium text-zinc-500">Receipt path:</span>{" "}
                    <code className="text-xs">{executeResult.outputPath ?? "—"}</code>
                  </div>
                </div>
              </>
            )}
            {isRecovery && (
              <>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Recovery runbook recorded. No autonomous remediation. Follow the runbook manually.
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <span className="font-medium text-zinc-500">Runbook path:</span>{" "}
                    <code className="text-xs">{executeResult.outputPath ?? "—"}</code>
                  </div>
                </div>
              </>
            )}
            {executeResult.kind === "youtube.package" && (
              <>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  This created a package + receipts. It did not post anything.
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <span className="font-medium text-zinc-500">Output path:</span>{" "}
                    <code className="text-xs">{executeResult.outputPath ?? "—"}</code>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Next: Open package → paste title/description/tags → upload manually in YouTube Studio
                  </p>
                  <div>
                    <span className="font-medium text-zinc-500">Upload readiness:</span>{" "}
                    {executeResult.readyForUpload ? "READY" : "NOT READY"}
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">Tags count:</span>{" "}
                    {executeResult.tagsCount ?? "—"}
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">Video file path:</span>{" "}
                    {executeResult.videoFilePath ?? "none"}
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">Adapter:</span>{" "}
                    youtube.v1
                  </div>
                </div>
              </>
            )}
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Receipts recorded in action log.
            </p>
            {executeResult.kind === "youtube.package" && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                This created a local YouTube package. You still upload manually in YouTube Studio.
              </p>
            )}
            {(executeResult.outputPath ?? executeResult.artifactPath) && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                    {executeResult.outputPath ?? executeResult.artifactPath}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        executeResult.outputPath ?? executeResult.artifactPath ?? ""
                      )
                    }
                    className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch("/api/os/open", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            path: executeResult.outputPath ?? executeResult.artifactPath,
                            app: "finder",
                          }),
                        });
                      } catch {
                        // ignore
                      }
                    }}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    {isRecovery
                      ? "Open runbook in Finder"
                      : executeResult.kind === "send_email"
                        ? "Open receipt in Finder"
                        : executeResult.outputPath
                          ? "Open package in Finder"
                          : "Open artifact in Finder"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch("/api/os/open", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            path: executeResult.outputPath ?? executeResult.artifactPath,
                            app: "cursor",
                          }),
                        });
                      } catch {
                        // ignore
                      }
                    }}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    {executeResult.kind === "send_email"
                      ? "Open receipt in Cursor"
                      : executeResult.outputPath
                        ? "Open package in Cursor"
                        : "Open artifact in Cursor"}
                  </button>
                  {executeResult.kind === "youtube.package" && (
                    <>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            const p = event.payload as Record<string, unknown>;
                            const yt = p?.youtube as Record<string, unknown> | undefined;
                            const title = String(normalized.title ?? "(untitled)");
                            const description = String(normalized.body ?? "");
                            const tags = typeof yt?.tags === "string" ? yt.tags : "";
                            const text = `Title\n${title}\n\nDescription\n${description}\n\nTags\n${tags}`;
                            navigator.clipboard.writeText(text);
                          }}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          Copy upload fields
                        </button>
                        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                          Paste into YouTube Studio (no links, no paths).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const summary = [
                            `Title: ${normalized.title ?? "(untitled)"}`,
                            `Output path: ${executeResult.outputPath ?? executeResult.artifactPath ?? ""}`,
                            `Upload readiness: ${executeResult.readyForUpload ? "READY" : "NOT READY"}`,
                            `Tags count: ${executeResult.tagsCount ?? "—"}`,
                            `Video file path: ${executeResult.videoFilePath ?? "none"}`,
                            "",
                            "Next step: Upload manually (no posting occurs without explicit approval + execution).",
                          ].join("\n");
                          navigator.clipboard.writeText(summary);
                        }}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                      >
                        Copy package summary
                      </button>
                    </>
                  )}
                  {(executeResult.kind === "content.publish" ||
                    executeResult.kind === "youtube.package") &&
                    onCreateReflection && (
                    <button
                      type="button"
                      onClick={() => onCreateReflection(executeResult)}
                      className="rounded border border-emerald-600 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                    >
                      Create Reflection (proposal)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApprovalsPanel() {
  const [allApprovals, setAllApprovals] = useState<ApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [irreversibleConfirmEnabled, setIrreversibleConfirmEnabled] = useState(true);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
  const [executeError, setExecuteError] = useState<ExecuteError | null>(null);
  const [executeLoading, setExecuteLoading] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/approvals?status=all");
      const json = (await res.json()) as ApprovalsResponse;
      setAllApprovals(json);
    } catch {
      setAllApprovals({ dateKey: "", approvals: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchApprovals());
    const id = setInterval(fetchApprovals, 5000);
    return () => clearInterval(id);
  }, [fetchApprovals]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => {
        if (typeof c.irreversibleConfirmEnabled === "boolean") {
          setIrreversibleConfirmEnabled(c.irreversibleConfirmEnabled);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => fetchApprovals();
    window.addEventListener("jarvis-refresh", handler);
    return () => window.removeEventListener("jarvis-refresh", handler);
  }, [fetchApprovals]);

  const handleApprove = useCallback(
    async (id: string, approvalPreflightSnapshotWire?: ApprovalPreflightSnapshotWire) => {
      try {
        const body: Record<string, unknown> = { action: "approve" };
        if (approvalPreflightSnapshotWire !== undefined) {
          body.approvalPreflightSnapshot = approvalPreflightSnapshotWire;
        }
        const res = await fetch(`/api/approvals/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setDetailEvent(updated);
          setExecuteResult(null);
          fetchApprovals();
        }
      } catch {
        // ignore
      }
    },
    [fetchApprovals]
  );

  const handleDeny = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/approvals/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deny" }),
        });
        if (res.ok) {
          setDetailEvent(null);
          fetchApprovals();
        }
      } catch {
        // ignore
      }
    },
    [fetchApprovals]
  );

  const handleExecute = useCallback(
    async (id: string) => {
      setExecuteLoading(true);
      setExecuteResult(null);
      setExecuteError(null);
      try {
        const res = await fetch(`/api/execute/${id}`, {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        if (res.ok) {
          setExecuteResult(json);
          setExecuteError(null);
          fetchApprovals();
          const updated = detailEvent?.id === id
            ? { ...detailEvent, executed: true, executedAt: json.executedAt }
            : detailEvent;
          if (updated) setDetailEvent(updated);
        } else if (res.status === 400 && json.error) {
          setExecuteError({
            approvalId: id,
            error: json.error,
            reasons: Array.isArray(json.reasons) ? json.reasons : undefined,
            reasonDetails: Array.isArray(json.reasonDetails) ? json.reasonDetails : undefined,
          });
        } else if (res.status === 403 && json.code === "STEP_UP_REQUIRED") {
          setExecuteError({
            approvalId: id,
            error: json.error ?? "Step-up required",
            stepUpRequired: true,
          });
        } else if (res.status === 409 && json.error) {
          setExecuteError({
            approvalId: id,
            error: json.error,
            reasonDetails: Array.isArray(json.reasonDetails) ? json.reasonDetails : undefined,
          });
        }
      } catch {
        // ignore
      } finally {
        setExecuteLoading(false);
      }
    },
    [fetchApprovals, detailEvent]
  );

  const handleCreateReflection = useCallback(
    async (result: ExecuteResult) => {
      const sourceOutputPath = result.outputPath ?? result.artifactPath ?? "";
      if (!sourceOutputPath) return;
      try {
        const res = await fetch("/api/reflections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceKind: result.kind,
            sourceApprovalId: result.approvalId,
            sourceOutputPath,
          }),
        });
        if (res.ok) {
          fetchApprovals();
          window.dispatchEvent(new CustomEvent("jarvis-refresh"));
        }
      } catch {
        // ignore
      }
    },
    [fetchApprovals]
  );

  const raw = allApprovals?.approvals ?? [];
  const approvals = raw.filter((e) => isPendingApproval(e));
  const approvedNotExecuted = raw.filter((e) => isApprovedAwaitingExecution(e));
  const lastExecutedProposal =
    [...raw]
      .filter((e) => isExecuted(e))
      .sort(
        (a, b) =>
          new Date(b.executedAt ?? b.createdAt).getTime() -
          new Date(a.executedAt ?? a.createdAt).getTime()
      )[0] ?? null;

  return (
    <>
      <AgentProposalsFeed
        pendingApprovals={approvals}
        approvedNotExecuted={approvedNotExecuted}
        lastExecutedProposal={lastExecutedProposal}
        loading={loading}
        dateKey={allApprovals?.dateKey}
        onDetails={(e) => setDetailEvent(e as Event)}
        onApprove={handleApprove}
        onDeny={handleDeny}
        onRefresh={fetchApprovals}
        irreversibleConfirmEnabled={irreversibleConfirmEnabled}
      />

      {detailEvent && (
        <DetailModal
          event={detailEvent}
          onClose={() => {
            setDetailEvent(null);
            setExecuteResult(null);
            setExecuteError(null);
          }}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onExecute={handleExecute}
          onCreateReflection={handleCreateReflection}
          executeResult={executeResult}
          executeError={executeError}
          executeLoading={executeLoading}
          irreversibleConfirmEnabled={irreversibleConfirmEnabled}
          listDateKey={allApprovals?.dateKey ?? ""}
        />
      )}
    </>
  );
}
