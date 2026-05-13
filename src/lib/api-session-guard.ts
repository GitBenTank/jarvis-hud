import { NextResponse } from "next/server";
import type { Session } from "@/lib/auth";
import { AuthConfigError, getSessionFromCookie, isAuthEnabled } from "@/lib/auth";

/**
 * Node-side session gate for browser-backed `/api` routes (defense in depth with `src/proxy.ts`).
 * The proxy only checks cookie **presence** (edge-safe). Handlers must verify the signed cookie here.
 *
 * @see docs/architecture/network-proxy-boundary.md
 * @see docs/architecture/security-model.md (boundaries table — verified session / Node)
 */
export const SESSION_REQUIRED_JSON = {
  error: "Session required. Call POST /api/auth/init first.",
  code: "session_required" as const,
};

export type VerifiedSessionGate =
  | { ok: true; authEnabled: false; session: null }
  | { ok: true; authEnabled: true; session: Session }
  | { ok: false; response: NextResponse };

/** When auth is off, always `ok` with `session: null`. When auth is on, `ok` only if the cookie verifies. */
export function requireVerifiedSessionGate(
  cookieHeader: string | null
): VerifiedSessionGate {
  let authEnabled = false;
  try {
    authEnabled = isAuthEnabled();
  } catch (err) {
    if (err instanceof AuthConfigError) {
      return {
        ok: false,
        response: NextResponse.json({ error: err.message }, { status: 500 }),
      };
    }
    throw err;
  }
  if (!authEnabled) {
    return { ok: true, authEnabled: false, session: null };
  }
  const session = getSessionFromCookie(cookieHeader);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(SESSION_REQUIRED_JSON, { status: 401 }),
    };
  }
  return { ok: true, authEnabled: true, session };
}
