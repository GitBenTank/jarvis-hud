import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  validateAuditDateRange,
  buildAuditExportBundle,
} from "@/lib/audit-export";

/**
 * GET /api/audit/export?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Read-only JSON bundle for external audit (no UI required).
 * See docs/audit-export.md
 */
export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  const v = validateAuditDateRange(start, end);
  if (!v.ok) {
    return NextResponse.json(
      { error: v.message, code: v.code },
      { status: v.status }
    );
  }

  try {
    const bundle = await buildAuditExportBundle(v);
    return NextResponse.json(bundle);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[audit-export]", msg);
    return NextResponse.json(
      { error: "Audit export failed", code: "export_failed" },
      { status: 500 }
    );
  }
}
