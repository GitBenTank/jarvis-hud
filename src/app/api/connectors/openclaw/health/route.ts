import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { computeOpenClawHealth } from "@/lib/openclaw-health";

export async function GET() {
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
