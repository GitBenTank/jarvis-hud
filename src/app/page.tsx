import Link from "next/link";
import { Suspense } from "react";
import ActionsPanel from "@/components/ActionsPanel";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import AgentActivityPanel from "@/components/AgentActivityPanel";
import DraftsPanel from "@/components/DraftsPanel";
import ExecutionAuthorityBanner from "@/components/ExecutionAuthorityBanner";
import OpenClawHealthBadge from "@/components/OpenClawHealthBadge";
import IntegrationDebugPanel from "@/components/IntegrationDebugPanel";
import MissionStrip from "@/components/MissionStrip";
import ModePills from "@/components/ModePills";
import OperationsRow from "@/components/OperationsRow";
import TrustPostureStrip from "@/components/TrustPostureStrip";
import ResearchNotesPanel from "@/components/ResearchNotesPanel";
import SafetyGatePanel from "@/components/SafetyGatePanel";
import StatusStrip from "@/components/StatusStrip";
import TracePanel from "@/components/TracePanel";

const PROOF_CHIPS = [
  {
    label: "Trace ID",
    ariaLabel: "Trace identifier for reconstructing the execution",
    title: "Reconstructable execution trace",
  },
  {
    label: "Receipt",
    ariaLabel: "Outcome record with actor, action, and result",
    title: "Receipt of what happened",
  },
  {
    label: "Artifact",
    ariaLabel: "Produced output or file from execution",
    title: "Resulting artifact",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 space-y-3">
          <div className="mx-auto max-w-xl space-y-1.5 text-center">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Jarvis HUD — approval and proof layer for AI-driven action
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Jarvis decides what AI is allowed to do—and proves what it did.
            </p>
            <p className="text-[11px] tracking-wide text-zinc-500 opacity-60 dark:text-zinc-400">
              approval before action
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Every action produces a trace, a receipt, and a clear origin.
            </p>
            <ul
              className="m-0 flex list-none flex-wrap items-center justify-center gap-1.5 p-0 pt-0.5"
              aria-label="Proof artifacts in the product"
            >
              {PROOF_CHIPS.map((chip) => (
                <li
                  key={chip.label}
                  title={chip.title}
                  aria-label={chip.ariaLabel}
                  className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
                >
                  {chip.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/activity"
              className="text-sm font-medium text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Activity
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Docs
            </Link>
            <Link
              href="/demo"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Demo
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              About
            </Link>
          </div>
        </div>
        <TrustPostureStrip />
        <div className="mx-auto max-w-5xl px-4">
          <OpenClawHealthBadge showDataPathExplainer variant="card" />
          <IntegrationDebugPanel />
        </div>
        <MissionStrip />
        <div className="flex flex-col border-b border-zinc-700 bg-zinc-900 sm:flex-row sm:items-center sm:gap-4">
          <ExecutionAuthorityBanner />
          <ModePills />
        </div>
        <StatusStrip />
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Safety Gate</span>
            <SafetyGatePanel />
          </div>
        </div>
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-center text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
            — EXECUTION BOUNDARY —{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Autonomy in thinking. Authority in action.</span>{" "}
            <Link href="/about" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
              Philosophy & security
            </Link>
          </p>
        </div>

        {/* Operations Row — proposals + pipeline (control-plane focus) */}
        <div id="operations-row" className="mb-6">
          <OperationsRow />
        </div>

        {/* Executed Actions (Receipts) */}
        <div id="actions-panel" className="mb-6">
          <ActionsPanel />
        </div>

        {/* Draft / Submit form */}
        <div className="mb-6">
          <DraftsPanel />
        </div>

        {/* Informational panels */}
        <div className="space-y-6">
          <ActivityLogPanel />
          <AgentActivityPanel />
          <ResearchNotesPanel />
          <Suspense fallback={<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">Activity Timeline…</div>}>
            <TracePanel />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
