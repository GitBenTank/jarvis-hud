import { NextRequest, NextResponse } from "next/server";
import {
  isAuthEnabled,
  getSessionFromCookie,
  updateSessionStepUp,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Auth is not enabled (JARVIS_AUTH_ENABLED)" },
      { status: 400 }
    );
  }

  const cookie = request.headers.get("cookie");
  const session = getSessionFromCookie(cookie);

  if (!session) {
    return NextResponse.json(
      { error: "Session required. Call POST /api/auth/init first." },
      { status: 401 }
    );
  }

  const { session: updated, cookie: newCookie } = updateSessionStepUp(session);
  const response = NextResponse.json({
    ok: true,
    stepUpAt: updated.stepUpAt,
  });
  response.headers.set("Set-Cookie", newCookie);
  return response;
}
