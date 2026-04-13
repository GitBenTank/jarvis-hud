"use client";

import type { ExecutionTraceViewModel } from "@/lib/execution-trace-view";

const bandClasses: Record<
  ExecutionTraceViewModel["band"]["tone"],
  string
> = {
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  warning:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  error:
    "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
  pending:
    "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  neutral:
    "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200",
};

const stepDot: Record<
  ExecutionTraceViewModel["steps"][number]["tone"],
  string
> = {
  done: "bg-emerald-500",
  pending: "bg-amber-500",
  blocked: "bg-red-500",
  neutral: "bg-zinc-400",
};

type Props = Readonly<{
  view: ExecutionTraceViewModel | null;
}>;

export default function ExecutionTrace({ view }: Props) {
  if (!view) return null;

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/80"
      aria-label="Execution trace summary"
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        Trace story
      </div>
      <div
        className={`mb-3 inline-flex rounded border px-2.5 py-1 text-xs font-medium ${bandClasses[view.band.tone]}`}
      >
        {view.band.label}
      </div>
      <h3 className="mb-3 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
        {view.headline}
      </h3>
      <ol className="space-y-0 border-l-2 border-zinc-200 pl-4 dark:border-zinc-600">
        {view.steps.map((step) => (
          <li key={step.id} className="relative pb-4 last:pb-0">
            <span
              className={`absolute -left-[calc(0.5rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full ${stepDot[step.tone]}`}
              aria-hidden
            />
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              {step.label}
            </div>
            {step.actor && (
              <div className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-500">{step.actor}</div>
            )}
            {step.detail && (
              <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{step.detail}</p>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Result
        </div>
        <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{view.resultSummary}</p>
      </div>
    </section>
  );
}
