"use client";

import { describeRiskNarrative, getRiskLevel, type RiskLevel } from "@/lib/risk";
import type { ReasonDetail } from "@/lib/reason-taxonomy";

export type PreflightSafetyPayload = {
  kind: string;
  status: "ready" | "will_block";
  riskLevel: RiskLevel;
  expectedOutputs: string[];
  preflight: {
    willBlock: boolean;
    reasons: string[];
    reasonDetails: ReasonDetail[];
    notes: string[];
  };
};

function riskChipClass(level: RiskLevel): string {
  if (level === "high") {
    return "border-red-600/60 bg-red-100/80 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-300";
  }
  if (level === "medium") {
    return "border-amber-600/60 bg-amber-100/80 text-amber-800 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "border-emerald-600/60 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function readinessCopy(
  loading: boolean,
  preflight: PreflightSafetyPayload | null
): { label: string; chip: "ready" | "will_block" | "unknown"; detail: string } {
  if (loading) {
    return {
      label: "Checking…",
      chip: "unknown",
      detail: "Running preflight against current policy and environment.",
    };
  }
  if (!preflight) {
    return {
      label: "Unknown",
      chip: "unknown",
      detail:
        "Preflight did not complete. Readiness is unknown until you run Execute or retry opening this proposal.",
    };
  }
  if (preflight.status === "will_block") {
    const d = preflight.preflight.reasonDetails[0];
    const firstReason = preflight.preflight.reasons[0];
    const blocker = d
      ? `${d.label}: ${d.summary}`
      : firstReason ?? "Policy or environment will block execute.";
    return {
      label: "Will block",
      chip: "will_block",
      detail: `Will block: ${blocker}`,
    };
  }
  return {
    label: "Ready",
    chip: "ready",
    detail:
      "Ready: current checks pass at approval time. Execute can still fail if the repo, auth, or policy changes.",
  };
}

type ApprovalSafetySectionProps = Readonly<{
  kind: string;
  preflight: PreflightSafetyPayload | null;
  preflightLoading: boolean;
  /** Show typed phrase + checkbox before Approve */
  showTypedApprovalGate: boolean;
  phrase: string;
  confirmCheckbox: boolean;
  onConfirmCheckbox: (checked: boolean) => void;
  confirmPhrase: string;
  onConfirmPhrase: (value: string) => void;
}>;

export default function ApprovalSafetySection({
  kind,
  preflight,
  preflightLoading,
  showTypedApprovalGate,
  phrase,
  confirmCheckbox,
  onConfirmCheckbox,
  confirmPhrase,
  onConfirmPhrase,
}: ApprovalSafetySectionProps) {
  const riskLevel = preflight?.riskLevel ?? getRiskLevel(kind);
  const narrative = describeRiskNarrative(kind);
  const readiness = readinessCopy(preflightLoading, preflight);

  return (
    <div className="rounded border border-zinc-300 bg-zinc-50 p-3 text-sm dark:border-zinc-600 dark:bg-zinc-900/40">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
        Safety & readiness
      </h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex min-w-[10rem] flex-1 flex-col gap-1 rounded border border-zinc-200 bg-white px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-950/50">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Risk level</span>
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${riskChipClass(riskLevel)}`}
            >
              {riskLevel}
            </span>
          </span>
          <p className="text-xs leading-snug text-zinc-700 dark:text-zinc-300">{narrative}</p>
        </div>

        <div className="flex min-w-[10rem] flex-1 flex-col gap-1 rounded border border-zinc-200 bg-white px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-950/50">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Execution readiness
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                readiness.chip === "ready"
                  ? "border-emerald-600/50 bg-emerald-100 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : readiness.chip === "will_block"
                    ? "border-amber-600/50 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-zinc-400/60 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {readiness.label}
            </span>
          </span>
          <p className="text-xs leading-snug text-zinc-700 dark:text-zinc-300">{readiness.detail}</p>
        </div>
      </div>

      {!preflightLoading && preflight && preflight.preflight.reasonDetails.length > 0 && (
        <div className="mt-3 rounded border border-zinc-200 bg-white/80 px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-950/30">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Preflight checks</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-zinc-700 dark:text-zinc-300">
            {preflight.preflight.reasonDetails.map((d) => (
              <li key={d.code}>
                <span className="font-medium">{d.label}:</span> {d.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!preflightLoading && preflight && preflight.status === "ready" && preflight.preflight.reasonDetails.length === 0 && (
        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
          Preflight snapshot: no policy blockers reported for this kind in the current environment.
        </p>
      )}

      {!preflightLoading && preflight && preflight.expectedOutputs.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Expected outputs</p>
          <ul className="mt-1 list-inside list-disc text-xs text-zinc-600 dark:text-zinc-400">
            {preflight.expectedOutputs.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {!preflightLoading && preflight && preflight.preflight.notes.length > 0 && (
        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          {preflight.preflight.notes.join(" ")}
        </p>
      )}

      {showTypedApprovalGate && (
        <div className="mt-4 rounded border-2 border-red-500/70 bg-red-50/90 p-3 dark:border-red-500/50 dark:bg-red-950/35">
          <p className="text-sm font-semibold text-red-900 dark:text-red-200">
            Typed confirmation required to approve
          </p>
          <p className="mt-1 text-xs text-red-900/90 dark:text-red-200/90">
            This action is high-risk and irreversible in the sense that it can change repository state. Approve is
            disabled until you confirm below.
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            Type this exact phrase (case-sensitive):
          </p>
          <code className="mt-1 block rounded border border-red-300 bg-white px-2 py-1.5 font-mono text-sm font-semibold tracking-wide text-red-900 dark:border-red-800 dark:bg-zinc-950 dark:text-red-300">
            {phrase}
          </code>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={confirmCheckbox}
              onChange={(e) => onConfirmCheckbox(e.target.checked)}
              className="mt-0.5 rounded border-zinc-400"
            />
            <span>I understand approving authorizes Execute, which may modify the working tree and create a local git commit for this kind.</span>
          </label>
          <label className="mt-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Enter the phrase
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => onConfirmPhrase(e.target.value)}
              placeholder={phrase}
              autoComplete="off"
              spellCheck={false}
              className={`mt-1 w-full rounded border px-3 py-2 font-mono text-sm dark:bg-zinc-900 dark:text-zinc-100 ${
                confirmPhrase.length > 0 && confirmPhrase.trim() !== phrase
                  ? "border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950/40"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
            />
          </label>
          {confirmPhrase.length > 0 && confirmPhrase.trim() !== phrase ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Must match exactly, including case.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
