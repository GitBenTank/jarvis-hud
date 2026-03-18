/**
 * Trace Replay API — reconstruct a trace from stored logs.
 * Returns normalized replay model: proposal, approval, policyDecisions, execution, receipts, reconciliation.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { assembleTraceReplay } from "@/lib/trace-replay";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ traceId: string }> }
) {
  const { traceId } = await params;
  if (!traceId || typeof traceId !== "string" || !traceId.trim()) {
    return NextResponse.json(
      { error: "traceId is required" },
      { status: 400 }
    );
  }

  const result = await assembleTraceReplay(traceId);

  if (!result) {
    return NextResponse.json(
      { error: "Trace not found", traceId: traceId.trim() },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
