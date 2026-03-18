/**
 * Alfred orchestrator status API.
 * Reads ~/jarvis/logs/alfred_orchestrator.jsonl (or JARVIS_ROOT/logs/alfred_orchestrator.jsonl).
 * Does not modify orchestrator code or governance logic.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { promises as fs } from "node:fs";
import {
  getAlfredOrchestratorLogPath,
  ensurePathSafe,
} from "@/lib/storage";

const SCAN_INTERVAL_MINUTES = 10;

type LogLine = {
  timestamp?: string;
  anomalyId?: string;
  noteId?: string;
  suppressed?: boolean;
  action?: string;
  [key: string]: unknown;
};

export type AlfredStatusResponse = {
  latestScanAt: string | null;
  proposalsCreatedLastScan: number;
  proposalsSuppressedLastScan: number;
  nextScanAt: string | null;
  outcome: "created" | "suppressed" | "none" | "unknown";
};

function parseLogLine(line: string): LogLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as LogLine;
  } catch {
    return null;
  }
}

function isProposalCreated(entry: LogLine): boolean {
  return !!(entry.noteId && entry.suppressed !== true);
}

function isProposalSuppressed(entry: LogLine): boolean {
  return (
    entry.suppressed === true ||
    (typeof entry.action === "string" && entry.action.toLowerCase() === "suppressed")
  );
}

/**
 * Read last N lines of a file efficiently (for JSONL, we need recent entries).
 */
async function readLastLines(
  filePath: string,
  maxLines: number
): Promise<string[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  return lines.slice(-maxLines);
}

export async function GET(): Promise<NextResponse<AlfredStatusResponse | { error: string }>> {
  try {
    const logPath = getAlfredOrchestratorLogPath();
    ensurePathSafe(logPath);

    const lines = await readLastLines(logPath, 200);
    const entries = lines.map(parseLogLine).filter((e): e is LogLine => e !== null);

    if (entries.length === 0) {
      return NextResponse.json({
        latestScanAt: null,
        proposalsCreatedLastScan: 0,
        proposalsSuppressedLastScan: 0,
        nextScanAt: null,
        outcome: "unknown",
      });
    }

    const byTimestamp = new Map<string, { created: number; suppressed: number }>();
    for (const e of entries) {
      const ts = e.timestamp ?? "";
      if (!ts) continue;
      const bucket = byTimestamp.get(ts) ?? { created: 0, suppressed: 0 };
      if (isProposalCreated(e)) bucket.created += 1;
      else if (isProposalSuppressed(e)) bucket.suppressed += 1;
      byTimestamp.set(ts, bucket);
    }

    const timestamps = [...byTimestamp.keys()].sort().reverse();
    const latestTs = timestamps[0] ?? null;
    const lastScan = latestTs ? byTimestamp.get(latestTs) : null;

    const proposalsCreated = lastScan?.created ?? 0;
    const proposalsSuppressed = lastScan?.suppressed ?? 0;

    let outcome: AlfredStatusResponse["outcome"] = "unknown";
    if (proposalsCreated > 0) outcome = "created";
    else if (proposalsSuppressed > 0) outcome = "suppressed";
    else if (entries.length > 0) outcome = "none";

    let nextScanAt: string | null = null;
    if (latestTs) {
      const latest = new Date(latestTs);
      latest.setMinutes(latest.getMinutes() + SCAN_INTERVAL_MINUTES);
      nextScanAt = latest.toISOString();
    }

    return NextResponse.json({
      latestScanAt: latestTs,
      proposalsCreatedLastScan: proposalsCreated,
      proposalsSuppressedLastScan: proposalsSuppressed,
      nextScanAt,
      outcome,
    });
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : null;
    if (code === "ENOENT") {
      return NextResponse.json({
        latestScanAt: null,
        proposalsCreatedLastScan: 0,
        proposalsSuppressedLastScan: 0,
        nextScanAt: null,
        outcome: "unknown",
      });
    }
    console.error("[alfred/status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read Alfred log" },
      { status: 500 }
    );
  }
}
