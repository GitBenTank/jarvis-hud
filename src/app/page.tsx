import Link from "next/link";
import { Suspense } from "react";
import ActionsPanel from "@/components/ActionsPanel";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import AgentActivityPanel from "@/components/AgentActivityPanel";
import AgentRuntimeStatus from "@/components/AgentRuntimeStatus";
import ApprovalsPanel from "@/components/ApprovalsPanel";
import DraftsPanel from "@/components/DraftsPanel";
import ExecutionAuthorityBanner from "@/components/ExecutionAuthorityBanner";
import ModePills from "@/components/ModePills";
import RuntimeTelemetryStrip from "@/components/RuntimeTelemetryStrip";
import SafetyGatePanel from "@/components/SafetyGatePanel";
import ExecutionTimeline from "@/components/ExecutionTimeline";
import ResearchNotesPanel from "@/components/ResearchNotesPanel";
import SystemStatus from "@/components/SystemStatus";
import TracePanel from "@/components/TracePanel";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-center gap-4">
          <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Jarvis HUD — Runtime Boundary Layer for Agentic Execution
          </p>
          <Link
            href="/activity"
            className="text-sm font-medium text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Activity
          </Link>
        </div>
        <div className="flex flex-col border-b border-zinc-700 bg-zinc-900 sm:flex-row sm:items-center sm:gap-4">
          <ExecutionAuthorityBanner />
          <ModePills />
        </div>
        <RuntimeTelemetryStrip />
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Safety Gate</span>
            <SafetyGatePanel />
          </div>
        </div>
        <AgentRuntimeStatus />
        <SystemStatus />
        <div className="mb-6">
          <ActivityLogPanel />
        </div>
        <div className="mb-6">
          <AgentActivityPanel />
        </div>
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Runtime Control Plane</h2>
          <div className="mt-3 flex flex-col gap-1 text-sm">
            <div>
              <span className="font-medium text-zinc-500">Agent:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Local runtime active</span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">Execution Mode:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Dry Run</span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">Authority Model:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Human-gated</span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">Cognition Layer:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Background agent loop</span>
            </div>
          </div>
        </div>
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Execution Authority (Thesis Lock)</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <span className="font-medium text-zinc-500">Mode:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Human-gated</span>
            </li>
            <li>
              <span className="font-medium text-zinc-500">Approval ≠ Execution</span>
            </li>
            <li>
              <span className="font-medium text-zinc-500">Posting adapters:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Disabled (no external posting)</span>
            </li>
            <li>
              <span className="font-medium text-zinc-500">External API access:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Off (for now)</span>
            </li>
            <li>
              <span className="font-medium text-zinc-500">Receipts:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Required (artifact + action log)</span>
            </li>
            <li>
              <span className="font-medium text-zinc-500">Trusted principal:</span>{" "}
              <span className="text-zinc-800 dark:text-zinc-200">Human (not the model)</span>
            </li>
          </ul>
          <hr className="mt-4 mb-3 border-t border-zinc-300 dark:border-zinc-700" />
          <div className="text-center">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              — EXECUTION BOUNDARY —
            </div>
            <div className="space-y-0.5 text-base font-bold text-zinc-800 dark:text-zinc-200">
              <div>Autonomy in thinking.</div>
              <div>Authority in action.</div>
            </div>
          </div>
        </div>
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Security Posture (Zero Trust)</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="font-medium text-zinc-600 dark:text-zinc-400">Threats we defend against</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-600 dark:text-zinc-400">
                <li>Prompt injection / tool misuse</li>
                <li>Stolen session / stolen account</li>
                <li>Data exfil via tool outputs</li>
                <li>Confused deputy (model tricks tool permissions)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-600 dark:text-zinc-400">
                Current controls{" "}
                <span className="inline-block rounded border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Execution Policy: enforced
                </span>
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-600 dark:text-zinc-400">
                <li>Human-gated execution (approve ≠ execute)</li>
                <li>External API access: OFF (for now)</li>
                <li>Posting adapters: disabled</li>
                <li>Receipts: required (artifact + action log)</li>
                <li>Deterministic packaging (local files only)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-500 dark:text-zinc-500">
                Controls (planned) <span className="text-xs italic">(roadmap, not implemented)</span>
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                <li>Re-authentication to execute (step-up)</li>
                <li>Execution allowlist per kind (capabilities)</li>
                <li>Trusted ingress allowlists (reduce prompt injection surface)</li>
                <li>Scoped connector identities (separate accounts / service principals)</li>
                <li>Key limits and alerts (policy-gated outbound)</li>
                <li>Session TTL + device binding</li>
                <li>Rate limits + audit alerts</li>
                <li>Sanitization / injection checks on rendered content</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs italic text-zinc-500 dark:text-zinc-400">
            Zero Trust: never trust, always verify.
          </p>
        </div>
        <div className="mb-6">
          <ResearchNotesPanel />
        </div>
        <div className="mb-6">
          <Suspense fallback={<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">Activity Timeline…</div>}>
            <TracePanel />
          </Suspense>
        </div>
        <div className="space-y-6">
          <DraftsPanel />
          <ApprovalsPanel />
          <div>
            <ExecutionTimeline />
          </div>
          <ActionsPanel />
        </div>
      </main>
    </div>
  );
}
