import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { readActionLog } from "@/lib/action-log";
import { getDateKey } from "@/lib/storage";

export async function GET() {
  try {
    const dateKey = getDateKey();
    const actions = await readActionLog();
    return NextResponse.json({ dateKey, actions });
  } catch {
    return NextResponse.json(
      { error: "Failed to load actions" },
      { status: 500 }
    );
  }
}
