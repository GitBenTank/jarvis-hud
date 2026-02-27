"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeAction } from "@/lib/normalize";
import Badge from "./Badge";

type Event = {
  id: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
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
};

type ExecuteError = {
  approvalId: string;
  error: string;
  reasons?: string[];
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

function getCardSummary(payload: unknown): string {
  const n = normalizeAction(payload);
  if (n.kind === "content.publish" && n.channel && n.title) {
    return `${n.channel} · ${n.title}`;
  }
  if (n.kind === "reflection.note") {
    return n.summary || "Reflection note";
  }
  if (n.kind === "system.note") {
    return n.summary || "System note";
  }
  return n.summary || "(no summary)";
}

type DetailModalProps = Readonly<{
  event: Event;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onExecute: (id: string) => void;
  onCreateReflection?: (result: ExecuteResult) => void;
  executeResult: ExecuteResult | null;
  executeError: ExecuteError | null;
  executeLoading: boolean;
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
}: DetailModalProps) {
  const normalized = normalizeAction(event.payload);
  const isPublish = normalized.kind === "content.publish";
  const isReflection = normalized.kind === "reflection.note";
  const isSystemNote = normalized.kind === "system.note";
  const isYouTube = isPublish && normalized.channel === "youtube";
  const isExecutable = isPublish || isReflection || isSystemNote;
  const blockedForEvent = executeError?.approvalId === event.id;
  const youtubeTagCount = isYouTube ? getYoutubeTagCount(event.payload) : null;

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

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-zinc-500">Type</dt>
            <dd>{event.type}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Status</dt>
            <dd>
              {event.executed ? (
                <Badge variant="executed">EXECUTED</Badge>
              ) : event.status === "approved" ? (
                <Badge variant="approved">APPROVED</Badge>
              ) : (
                <Badge variant="pending">PENDING</Badge>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Agent</dt>
            <dd>{event.agent}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Created</dt>
            <dd>{event.createdAt}</dd>
          </div>
        </dl>

        {(isPublish || isReflection || isSystemNote) && (
          <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/30">
            <h3 className="font-medium">What happens if you approve?</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
              <li>
                <strong>Approve</strong> = changes status only (no posting)
              </li>
              <li>
                {isReflection ? (
                  <strong>Execute</strong>
                ) : (
                  <strong>Execute (dry run)</strong>
                )}{" "}
                = {isReflection
                  ? "writes reflection files + action log receipt"
                  : "writes artifact to publish-queue + action log, still no posting"}
              </li>
            </ul>
            {isPublish && (
              <p className="mt-2 font-bold text-zinc-800 dark:text-zinc-200">
                Posting is NOT implemented
              </p>
            )}
          </div>
        )}

        {isPublish ? (
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
              Source: {(event.payload as Record<string, unknown>)?.sourceKind} ·{" "}
              {(event.payload as Record<string, unknown>)?.sourceApprovalId as string}
            </p>
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
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => onDeny(event.id)}
              className="rounded bg-zinc-200 px-4 py-2 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              Deny
            </button>
            <button
              onClick={() => onApprove(event.id)}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Approve
            </button>
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
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
              {(executeError.reasons ?? [executeError.error]).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {isYouTube && youtubeTagCount !== null && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Tags: {youtubeTagCount} (minimum 8)
              </p>
            )}
          </div>
        )}

        {event.status === "approved" && !event.executed && isExecutable && (
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => onExecute(event.id)}
              disabled={executeLoading}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {executeLoading ? "Executing…" : isReflection ? "Execute" : "Execute (dry run)"}
            </button>
            {isPublish && <Badge variant="dry_run">DRY RUN</Badge>}
          </div>
        )}

        {event.status === "approved" && !event.executed && !isExecutable && (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/30">
            <p className="font-medium">Execution not supported yet</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Only content.publish, reflection.note, and system.note actions can be executed.
            </p>
          </div>
        )}

        {executeResult && executeResult.approvalId === event.id && (
          <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-900/30">
            <p className="font-medium">Executed</p>
            <p className="mt-1 flex items-center gap-2">
              <Badge variant="dry_run">DRY RUN</Badge>
            </p>
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
                    {executeResult.outputPath
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
                    {executeResult.outputPath
                      ? "Open package in Cursor"
                      : "Open artifact in Cursor"}
                  </button>
                  {executeResult.kind === "youtube.package" && (
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
  const [data, setData] = useState<ApprovalsResponse | null>(null);
  const [approvedData, setApprovedData] = useState<ApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
  const [executeError, setExecuteError] = useState<ExecuteError | null>(null);
  const [executeLoading, setExecuteLoading] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("/api/approvals?status=pending"),
        fetch("/api/approvals?status=approved"),
      ]);
      const pending = await pendingRes.json();
      const approved = await approvedRes.json();
      setData(pending);
      setApprovedData(approved);
    } catch {
      setData({ dateKey: "", approvals: [] });
      setApprovedData({ dateKey: "", approvals: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    const id = setInterval(fetchApprovals, 5000);
    return () => clearInterval(id);
  }, [fetchApprovals]);

  useEffect(() => {
    const handler = () => fetchApprovals();
    window.addEventListener("jarvis-refresh", handler);
    return () => window.removeEventListener("jarvis-refresh", handler);
  }, [fetchApprovals]);

  const handleApprove = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/approvals/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
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
        const res = await fetch(`/api/execute/${id}`, { method: "POST" });
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

  const approvals = data?.approvals ?? [];
  const approvedNotExecuted = (approvedData?.approvals ?? []).filter(
    (e) => !e.executed
  );

  function StatusBadge({ event }: { event: Event }) {
    if (event.executed) return <Badge variant="executed">EXECUTED</Badge>;
    if (event.status === "approved") return <Badge variant="approved">APPROVED</Badge>;
    return <Badge variant="pending">PENDING</Badge>;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Proposals Awaiting Authorization {data?.dateKey && `(${data.dateKey})`}
        </h2>
        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="rounded bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          Refresh
        </button>
      </div>

      {loading && approvals.length === 0 && (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
      {!loading && approvals.length === 0 && (
        <>
          <p className="text-sm text-zinc-500">No proposals awaiting authorization.</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            The agent may propose. Execution authority originates with a human.
          </p>
        </>
      )}
      {approvals.length > 0 && (
        <>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            The agent may propose. Execution authority originates with a human.
          </p>
          <ul className="space-y-3">
          {approvals.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-300 p-3 dark:border-amber-600"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {normalizeAction(event.payload).kind}
                  </span>
                  <StatusBadge event={event} />
                  <span className="text-zinc-500">·</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {event.agent}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                  {getCardSummary(event.payload)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {event.createdAt}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDetailEvent(event)}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Details
                </button>
                <button
                  onClick={() => handleDeny(event.id)}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Deny
                </button>
                <button
                  onClick={() => handleApprove(event.id)}
                  className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}

      {approvedNotExecuted.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-medium">Authorized (Awaiting Execution)</h3>
          <ul className="space-y-3">
            {approvedNotExecuted.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-blue-300 p-3 dark:border-blue-600"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {normalizeAction(event.payload).kind}
                    </span>
                    <StatusBadge event={event} />
                    <Badge variant="dry_run">DRY RUN</Badge>
                    <span className="text-zinc-500">·</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {event.agent}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {getCardSummary(event.payload)}
                  </p>
                </div>
                <button
                  onClick={() => setDetailEvent(event)}
                  className="rounded border border-blue-300 px-3 py-1 text-sm dark:border-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                >
                  Details / Execute (dry run)
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

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
        />
      )}
    </div>
  );
}
