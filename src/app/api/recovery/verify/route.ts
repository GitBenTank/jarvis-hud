/**
 * Recovery verification API.
 * Operators mark executed recovery actions as verified or failed.
 * Human-gated, no autonomous logic.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

import { isRecoveryClass } from "@/lib/recovery-shared";
import { readActionLog } from "@/lib/action-log";
import { writeRecoveryVerification } from "@/lib/recovery-verification";

export type RecoveryVerificationStatus = "pending" | "verified" | "failed";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const approvalId = body?.approvalId;
    const status = body?.status;

    if (typeof approvalId !== "string" || !approvalId.trim()) {
      return NextResponse.json(
        { error: "approvalId is required" },
        { status: 400 }
      );
    }

    if (status !== "verified" && status !== "failed") {
      return NextResponse.json(
        { error: "status must be 'verified' or 'failed'" },
        { status: 400 }
      );
    }

    function toDateKey(offsetDays: number): string {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    let action: Awaited<ReturnType<typeof readActionLog>>[number] | null = null;
    for (let i = 0; i < 7; i++) {
      const actions = await readActionLog(toDateKey(i));
      action = actions.find((a) => a.approvalId === approvalId) ?? null;
      if (action) break;
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action not found for approvalId" },
        { status: 404 }
      );
    }

    if (!isRecoveryClass(action.kind)) {
      return NextResponse.json(
        { error: "Only recovery actions can be verified" },
        { status: 400 }
      );
    }

    await writeRecoveryVerification(approvalId, status);

    return NextResponse.json({
      approvalId,
      status,
      markedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[recovery/verify]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}
