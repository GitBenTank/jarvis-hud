import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireVerifiedSessionGate } from "@/lib/api-session-guard";
import { computeOpenClawHealth } from "@/lib/openclaw-health";

export async function GET(request: NextRequest) {
  const gate = requireVerifiedSessionGate(request.headers.get("cookie"));
  if (!gate.ok) return gate.response;

  try {
    const body = await computeOpenClawHealth();
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      {
        status: "disconnected" as const,
        lastSeenAt: null,
        lastError: "Failed to compute OpenClaw health",
      },
      { status: 500 }
    );
  }
}
