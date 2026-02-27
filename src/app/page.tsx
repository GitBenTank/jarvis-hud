import ActionsPanel from "@/components/ActionsPanel";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import ApprovalsPanel from "@/components/ApprovalsPanel";
import DraftsPanel from "@/components/DraftsPanel";
import SystemStatus from "@/components/SystemStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-6 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Jarvis HUD — Runtime Boundary Layer for Agentic Execution
        </p>
        <SystemStatus />
        <div className="mb-6">
          <ActivityLogPanel />
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
        <div className="space-y-6">
          <DraftsPanel />
          <ApprovalsPanel />
          <ActionsPanel />
        </div>
      </main>
    </div>
  );
}
