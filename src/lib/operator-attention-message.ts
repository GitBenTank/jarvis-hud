/**
 * Plain-language operator attention line for queue-first surfaces (Activity, home handoff).
 * Keep copy aligned with Thesis Lock: humans decide; Jarvis gates and proves.
 */
export function buildOperatorAttentionMessage(
  pendingApproval: number,
  awaitingExecute: number
): string {
  if (pendingApproval === 0 && awaitingExecute === 0) {
    return "Nothing needs your decision right now.";
  }
  const parts: string[] = [];
  if (pendingApproval > 0) {
    parts.push(
      pendingApproval === 1
        ? "1 proposal needs your approval"
        : `${pendingApproval} proposals need your approval`
    );
  }
  if (awaitingExecute > 0) {
    parts.push(
      awaitingExecute === 1
        ? "1 approved item awaits execute"
        : `${awaitingExecute} approved items await execute`
    );
  }
  return parts.join(" · ");
}
