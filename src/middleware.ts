import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthEnabled, hasSessionCookie } from "@/lib/auth-edge";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  if (
    path === "/api/auth/init" ||
    path === "/api/auth/status" ||
    path === "/api/config" ||
    path.startsWith("/api/ingress/")
  ) {
    return NextResponse.next();
  }

  const cookie = request.headers.get("cookie");
  if (!hasSessionCookie(cookie)) {
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
