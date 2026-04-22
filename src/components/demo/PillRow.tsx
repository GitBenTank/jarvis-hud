"use client";

const STEPS = ["PROPOSE", "APPROVE", "EXECUTE", "RECEIPT", "TRACE"] as const;

const mono =
  "[font-family:var(--font-demo-mono),ui-monospace,monospace]" as const;

export function PillRow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mt-10 flex flex-wrap items-center justify-center gap-x-0.5 gap-y-3 ${className}`}
      aria-label="Execution lifecycle"
    >
      {STEPS.map((label, i) => (
        <span key={label} className="flex items-center">
          <span
            className={`${mono} rounded-full border border-sky-400/30 bg-sky-500/[0.08] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100/90 sm:px-4 sm:text-[11px]`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="px-1 text-zinc-600 sm:px-1.5" aria-hidden>
              →
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
