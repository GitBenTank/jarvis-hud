import Link from "next/link";
import { Suspense } from "react";
import ActivityGraph from "@/components/ActivityGraph";
import TracePanel from "@/components/TracePanel";

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-8">
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
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Control Plane Graph
            </span>
          </div>
          <ActivityGraph />
        </div>
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                Activity Timeline…
              </div>
            }
          >
            <TracePanel />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
