import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getRecentTraces } from "@/lib/trace-scan";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("limit");
  const parsed = raw ? parseInt(raw, 10) : 20;
  const limit = Number.isFinite(parsed) ? parsed : 20;
  try {
    const traces = await getRecentTraces(limit);
    return NextResponse.json({ traces });
  } catch {
    return NextResponse.json(
      { error: "Failed to list recent traces" },
      { status: 500 }
    );
  }
}
