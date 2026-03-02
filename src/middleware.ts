import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthEnabled, getSessionFromCookie, AuthConfigError } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith("/api")) {
    return NextResponse.next();
  }

  try {
    if (!isAuthEnabled()) {
      return NextResponse.next();
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

  if (
    path === "/api/auth/init" ||
    path === "/api/auth/status" ||
    path === "/api/config"
  ) {
    return NextResponse.next();
  }

  const cookie = request.headers.get("cookie");
  const session = getSessionFromCookie(cookie);

  if (!session) {
    return NextResponse.json(
      { error: "Session required. Call POST /api/auth/init first." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
