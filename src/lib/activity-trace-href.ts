/**
 * Canonical deep link for opening a trace on Activity (graph + timeline).
 * Keep in sync with TracePanel URL handling (`?trace=`).
 */
export function activityTraceHref(traceOrProposalId: string): string {
  const t = traceOrProposalId.trim();
  if (!t) return "/activity";
  return `/activity?trace=${encodeURIComponent(t)}`;
}
