import { isExecuted, type ProposalLifecycleEvent } from "./proposal-lifecycle";

export function proposalTraceKey(event: ProposalLifecycleEvent): string {
  return String(event.traceId ?? event.id ?? "").trim();
}

/**
 * When the queue is empty of pending work, choose which executed proposal to
 * highlight: prefer `?trace=` when it matches an executed row in `raw`; else
 * fall back to `lastExecuted` and signal that the URL trace was not found.
 */
export function pickExecutedReceiptCardEvent<T extends ProposalLifecycleEvent>(
  raw: readonly T[],
  urlTraceId: string | null | undefined,
  lastExecuted: T | null
): { card: T | null; traceUrlFallback: boolean } {
  if (!lastExecuted) return { card: null, traceUrlFallback: false };
  const u = urlTraceId?.trim() ?? "";
  if (!u) return { card: lastExecuted, traceUrlFallback: false };
  const lower = u.toLowerCase();
  const hit = raw.find(
    (e) => isExecuted(e) && proposalTraceKey(e).toLowerCase() === lower
  );
  if (hit) return { card: hit, traceUrlFallback: false };
  return { card: lastExecuted, traceUrlFallback: true };
}
