import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  isAuthEnabled,
  getSessionFromCookie,
  isStepUpValid,
  AuthConfigError,
  isIdentityBindingRequired,
  sessionHasOidcBinding,
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
      identityBindingRequired: false,
      identityBound: false,
    });
  }

  const identityBindingRequired = isIdentityBindingRequired();
  const cookie = request.headers.get("cookie");
  const session = getSessionFromCookie(cookie);
  const identityBound = session ? sessionHasOidcBinding(session) : false;

  return NextResponse.json({
    authEnabled: true,
    hasSession: !!session,
    stepUpValid: session ? isStepUpValid(session) : false,
    identityBindingRequired,
    identityBound,
  });
}
