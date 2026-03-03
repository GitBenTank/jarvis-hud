/**
 * Edge-safe auth checks for middleware. No Node crypto.
 * Full verification happens in API routes (Node runtime).
 */

const COOKIE_NAME = "jarvis_session";

export function isAuthEnabled(): boolean {
  return process.env.JARVIS_AUTH_ENABLED === "true";
}

/** Check if request has a session cookie (presence only; no verification). */
export function hasSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = new RegExp(`${COOKIE_NAME}=([^;]+)`).exec(cookieHeader);
  return !!match?.[1];
}
