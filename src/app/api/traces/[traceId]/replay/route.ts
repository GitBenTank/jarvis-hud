/**
 * Trace Replay API — reconstruct a trace from stored logs.
 * Returns normalized replay model: proposal, approval, policyDecisions, execution, receipts, reconciliation.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireVerifiedSessionGate } from "@/lib/api-session-guard";
import { assembleTraceReplay } from "@/lib/trace-replay";
import { AuditExportIdentityIntegrityError } from "@/lib/audit-export-identity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ traceId: string }> }
) {
  const gate = requireVerifiedSessionGate(request.headers.get("cookie"));
  if (!gate.ok) return gate.response;

  const { traceId } = await params;
  if (!traceId || typeof traceId !== "string" || !traceId.trim()) {
    return NextResponse.json(
      { error: "traceId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await assembleTraceReplay(traceId);

    if (!result) {
      return NextResponse.json(
        { error: "Trace not found", traceId: traceId.trim() },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuditExportIdentityIntegrityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.httpStatus }
      );
    }
    throw err;
  }
}
