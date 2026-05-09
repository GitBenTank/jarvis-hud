/**
 * Next.js network proxy (App Router convention: proxy.ts).
 *
 * Thin boundary only: early /api interception, session *presence* when auth is on,
 * and passthrough for public API paths. No ingress verification, approvals, policy,
 * or execution decisions — those live in route handlers (Node) and the governance stack.
 *
 * @see docs/architecture/network-proxy-boundary.md
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthEnabled, hasSessionCookie } from "@/lib/auth-edge";

export function proxy(request: NextRequest) {
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
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
