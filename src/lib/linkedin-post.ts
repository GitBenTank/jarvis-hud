import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { LinkedInPostPayload } from "./linkedin-post-constants";
import { ensureDir, ensurePathSafe, getLinkedInPostArtifactPath, getLinkedInPostReceiptPath } from "./storage";

export type LinkedInPostDryRunReceipt = {
  kind: "linkedin.post";
  status: "DRY_RUN_READY";
  dryRun: true;
  mode: "dry_run_v1";
  approvalId: string;
  traceId: string;
  timestamp: string;
  bodyHash: string;
  bodyPreview: string;
  visibility: string;
  accountLabel: string;
  artifactPath: string;
  receiptPath: string;
  providerPostId: null;
  permalink: null;
};

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * v1: No LinkedIn API. Writes governed markdown artifact + JSON receipt under JARVIS_ROOT.
 * V2: Gate live post behind env (e.g. LINKEDIN_POST_LIVE) and extend receipt when implemented.
 */
export async function executeLinkedInPostDryRunAndWriteReceipt(args: {
  proposalTitle: string;
  payload: LinkedInPostPayload;
  approvalId: string;
  dateKey: string;
  executedAt: string;
  traceId: string;
}): Promise<{ receiptPath: string; artifactPath: string; receipt: LinkedInPostDryRunReceipt }> {
  const bodyHash = sha256Hex(args.payload.body);
  const bodyPreview =
    args.payload.body.length > 280
      ? `${args.payload.body.slice(0, 280)}…`
      : args.payload.body;

  const artifactPath = getLinkedInPostArtifactPath(args.dateKey, args.approvalId);
  const receiptPath = getLinkedInPostReceiptPath(args.dateKey, args.approvalId);
  ensurePathSafe(artifactPath);
  ensurePathSafe(receiptPath);
  await ensureDir(path.dirname(artifactPath));
  await ensureDir(path.dirname(receiptPath));

  const md = [
    "---",
    `kind: linkedin.post`,
    `visibility: ${args.payload.visibility}`,
    `accountLabel: ${args.payload.accountLabel}`,
    `bodyHash: ${bodyHash}`,
    `dryRun: true`,
    "---",
    "",
    `# ${args.proposalTitle}`,
    "",
    args.payload.body,
    "",
  ].join("\n");

  await fs.writeFile(artifactPath, md, "utf-8");

  const receipt: LinkedInPostDryRunReceipt = {
    kind: "linkedin.post",
    status: "DRY_RUN_READY",
    dryRun: true,
    mode: "dry_run_v1",
    approvalId: args.approvalId,
    traceId: args.traceId,
    timestamp: args.executedAt,
    bodyHash,
    bodyPreview,
    visibility: args.payload.visibility,
    accountLabel: args.payload.accountLabel,
    artifactPath,
    receiptPath,
    providerPostId: null,
    permalink: null,
  };

  await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf-8");

  return { receiptPath, artifactPath, receipt };
}
