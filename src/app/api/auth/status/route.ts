import { NextRequest, NextResponse } from "next/server";
import {
  isAuthEnabled,
  getSessionFromCookie,
  isStepUpValid,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authEnabled = isAuthEnabled();

  if (!authEnabled) {
    return NextResponse.json({
      authEnabled: false,
      hasSession: false,
      stepUpValid: false,
    });
  }

  const cookie = request.headers.get("cookie");
  const session = getSessionFromCookie(cookie);

  return NextResponse.json({
    authEnabled: true,
    hasSession: !!session,
    stepUpValid: session ? isStepUpValid(session) : false,
  });
}
