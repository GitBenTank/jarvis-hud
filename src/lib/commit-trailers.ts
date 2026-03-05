export type CommitTrailers = {
  traceId: string;
  approvalId: string;
  receiptPath: string;
  patchSha256: string;
  treeBefore: string | null;
  treeAfter: string | null;
};

/**
 * Append git-style trailers to the end of a commit message.
 * Trailers follow the format: Key: Value
 * A blank line is added before trailers if the message does not end with one.
 */
export function appendCommitTrailers(
  baseMessage: string,
  trailers: CommitTrailers
): string {
  const trimmed = baseMessage.trimEnd();
  const needsNewline = trimmed.length > 0 && !trimmed.endsWith("\n");
  const prefix = needsNewline ? trimmed + "\n" : trimmed;

  const lines: string[] = [
    "",
    `Jarvis-Trace: ${trailers.traceId}`,
    `Jarvis-Approval: ${trailers.approvalId}`,
    `Jarvis-Receipt: ${trailers.receiptPath}`,
    `Jarvis-Patch-SHA256: ${trailers.patchSha256}`,
    `Jarvis-Tree-Before: ${trailers.treeBefore ?? ""}`,
    `Jarvis-Tree-After: ${trailers.treeAfter ?? ""}`,
  ];

  return prefix + lines.join("\n") + "\n";
}
