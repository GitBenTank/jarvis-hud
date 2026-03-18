import Link from "next/link";
import { Suspense } from "react";
import ActionsPanel from "@/components/ActionsPanel";
import TraceProviderWrapper from "@/components/TraceProviderWrapper";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import AgentActivityPanel from "@/components/AgentActivityPanel";
import DraftsPanel from "@/components/DraftsPanel";
import ExecutionAuthorityBanner from "@/components/ExecutionAuthorityBanner";
import MissionStrip from "@/components/MissionStrip";
import ModePills from "@/components/ModePills";
import OperationsRow from "@/components/OperationsRow";
import ResearchNotesPanel from "@/components/ResearchNotesPanel";
import SafetyGatePanel from "@/components/SafetyGatePanel";
import StatusStrip from "@/components/StatusStrip";
import TracePanel from "@/components/TracePanel";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-5xl px-4 py-8">
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
          <Link
            href="/about"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            About
          </Link>
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

        <TraceProviderWrapper>
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
        </TraceProviderWrapper>
      </main>
    </div>
  );
}
