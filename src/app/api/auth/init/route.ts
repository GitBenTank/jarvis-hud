import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { createSession, isAuthEnabled, AuthConfigError } from "@/lib/auth";

export async function POST() {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json(
        { error: "Auth is not enabled (JARVIS_AUTH_ENABLED)" },
        { status: 400 }
      );
    }
  } catch (err) {
    if (err instanceof AuthConfigError) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }
    throw err;
  }

  const { session, cookie } = createSession();
  const response = NextResponse.json({ ok: true, sessionId: session.id });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
