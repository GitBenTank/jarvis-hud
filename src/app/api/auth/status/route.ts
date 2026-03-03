import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  isAuthEnabled,
  getSessionFromCookie,
  isStepUpValid,
  AuthConfigError,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  let authEnabled: boolean;
  try {
    authEnabled = isAuthEnabled();
  } catch (err) {
    if (err instanceof AuthConfigError) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }
    throw err;
  }

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
