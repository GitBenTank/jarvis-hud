import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { findApprovalPreflightSnapshot } from "@/lib/approval-preflight-snapshot-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const dateKey = request.nextUrl.searchParams.get("dateKey")?.trim() || null;
    const snapshot = await findApprovalPreflightSnapshot(id.trim(), dateKey);
    return NextResponse.json({ snapshot });
  } catch {
    return NextResponse.json(
      { error: "Failed to load approval preflight snapshot" },
      { status: 500 }
    );
  }
}
