import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  isAuthEnabled,
  getSessionFromCookie,
  isStepUpValid,
  AuthConfigError,
} from "@/lib/auth";
import { evaluatePreflightPolicy } from "@/lib/policy";
import { getCodeApplyBlockReasons } from "@/lib/code-apply";
import { getRiskLevel } from "@/lib/risk";

type PreflightBody = {
  kind?: string;
};

function expectedOutputs(kind: string): string[] {
  if (kind === "code.apply") {
    return ["Code apply bundle", "Action log receipt", "Rollback command (if commit created)"];
  }
  if (kind === "code.diff") return ["Code diff bundle", "Action log receipt"];
  if (kind === "system.note") return ["System note artifact", "Action log receipt"];
  if (kind.startsWith("recovery.")) return ["Recovery runbook", "Action log receipt"];
  if (kind === "reflection.note") return ["Reflection artifact", "Action log receipt"];
  if (kind === "youtube.package") return ["YouTube package artifact", "Action log receipt"];
  return ["Action artifact", "Action log receipt"];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PreflightBody;
    const kind = typeof body.kind === "string" ? body.kind : "";
    if (!kind) {
      return NextResponse.json({ error: "kind is required" }, { status: 400 });
    }

    let authEnabled = false;
    let stepUpValid = true;
    try {
      authEnabled = isAuthEnabled();
    } catch (err) {
      if (err instanceof AuthConfigError) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      throw err;
    }
    if (authEnabled) {
      const session = getSessionFromCookie(request.headers.get("cookie"));
      stepUpValid = !!session && isStepUpValid(session);
    }

    const preflight = evaluatePreflightPolicy({
      kind,
      authEnabled,
      stepUpValid,
      codeApplyBlockReasons: kind === "code.apply" ? getCodeApplyBlockReasons() : undefined,
    });

    return NextResponse.json({
      kind,
      status: preflight.willBlock ? "will_block" : "ready",
      riskLevel: getRiskLevel(kind),
      preflight,
      expectedOutputs: expectedOutputs(kind),
    });
  } catch {
    return NextResponse.json({ error: "Failed to run preflight" }, { status: 500 });
  }
}
