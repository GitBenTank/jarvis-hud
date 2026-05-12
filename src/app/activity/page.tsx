import Link from "next/link";
import { Suspense } from "react";
import ActivityDiagnosticsDisclosure from "@/components/activity/ActivityDiagnosticsDisclosure";
import ActivityProofPanel from "@/components/activity/ActivityProofPanel";
import ActivityProofRail from "@/components/activity/ActivityProofRail";
import { ApprovalQueueCountsProvider } from "@/components/ApprovalQueueCountsProvider";
import OpenClawHealthBadge from "@/components/OpenClawHealthBadge";
import OperatorAttentionBanner from "@/components/OperatorAttentionBanner";
import OperationsRow from "@/components/OperationsRow";
import StatusStrip from "@/components/StatusStrip";
import TrustPostureStrip from "@/components/TrustPostureStrip";

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Activity
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Dashboard
          </Link>
        </div>
        <p className="mb-4 max-w-2xl text-xs text-zinc-500 dark:text-zinc-400">
          Queue-first: approve and execute here. On wide screens, pipeline and
          trace context stay on the right. On smaller screens, open the
          Pipeline & trace section when you need proof context. Full graph and
          timeline live below.
        </p>
        <ApprovalQueueCountsProvider>
          <OperatorAttentionBanner />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,20rem)] lg:items-start">
            <div className="min-w-0 space-y-4">
              <OperationsRow layout="activity" />
            </div>
            <ActivityProofRail />
          </div>
        </ApprovalQueueCountsProvider>

        <ActivityDiagnosticsDisclosure>
          <TrustPostureStrip innerMaxClassName="mx-auto max-w-6xl" />
          <StatusStrip innerMaxClassName="mx-auto max-w-6xl" />
          <OpenClawHealthBadge />
        </ActivityDiagnosticsDisclosure>

        <Suspense
          fallback={
            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Loading proof panel…
            </div>
          }
        >
          <ActivityProofPanel />
        </Suspense>
      </main>
    </div>
  );
}
