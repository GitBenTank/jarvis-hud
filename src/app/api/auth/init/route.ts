import { NextResponse } from "next/server";
import { createSession, isAuthEnabled } from "@/lib/auth";

export async function POST() {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Auth is not enabled (JARVIS_AUTH_ENABLED)" },
      { status: 400 }
    );
  }

  const { session, cookie } = createSession();
  const response = NextResponse.json({ ok: true, sessionId: session.id });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
