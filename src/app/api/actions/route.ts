import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireVerifiedSessionGate } from "@/lib/api-session-guard";
import { readActionLog } from "@/lib/action-log";
import { getDateKey } from "@/lib/storage";
import { readRecoveryVerifications } from "@/lib/recovery-verification";
import { isRecoveryClass } from "@/lib/recovery-shared";

type ActionWithVerification = Awaited<ReturnType<typeof readActionLog>>[number] & {
  verificationStatus?: "pending" | "verified" | "failed";
};

export async function GET(request: NextRequest) {
  const gate = requireVerifiedSessionGate(request.headers.get("cookie"));
  if (!gate.ok) return gate.response;

  try {
    const dateKey = getDateKey();
    const [actions, verifications] = await Promise.all([
      readActionLog(),
      readRecoveryVerifications(),
    ]);
    const actionsWithVerification: ActionWithVerification[] = actions.map((a) => {
      const out: ActionWithVerification = { ...a };
      if (isRecoveryClass(a.kind)) {
        const v = verifications[a.approvalId];
        out.verificationStatus = v?.status ?? "pending";
      }
      return out;
    });
    return NextResponse.json({ dateKey, actions: actionsWithVerification });
  } catch {
    return NextResponse.json(
      { error: "Failed to load actions" },
      { status: 500 }
    );
  }
}
