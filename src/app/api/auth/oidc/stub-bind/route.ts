import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  isAuthEnabled,
  getSessionFromCookie,
  bindOidcToSession,
  isOidcStubBindEnabled,
  isIssuerInAllowlist,
  normalizeIssuerUrl,
  AuthConfigError,
} from "@/lib/auth";

/**
 * Dev/test OIDC “callback” stub: binds `iss`/`sub` onto the existing session cookie.
 * Disabled unless `JARVIS_OIDC_STUB_BIND=true`. Requires `JARVIS_OIDC_ISSUER_ALLOWLIST`.
 *
 * @see docs/architecture/identity-binding-claims-contract-v1.md
 */
export async function POST(request: NextRequest) {
  if (!isOidcStubBindEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (!isAuthEnabled()) {
      return NextResponse.json(
        { error: "Auth is not enabled (JARVIS_AUTH_ENABLED)" },
        { status: 400 }
      );
    }
  } catch (err) {
    if (err instanceof AuthConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    throw err;
  }

  const allowlistRaw = (process.env.JARVIS_OIDC_ISSUER_ALLOWLIST ?? "").trim();
  if (!allowlistRaw) {
    return NextResponse.json(
      {
        error:
          "JARVIS_OIDC_ISSUER_ALLOWLIST is required when JARVIS_OIDC_STUB_BIND is enabled",
        code: "oidc_stub_misconfigured",
      },
      { status: 500 }
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

  let body: { iss?: unknown; sub?: unknown };
  try {
    body = (await request.json()) as { iss?: unknown; sub?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const iss = typeof body.iss === "string" ? body.iss : "";
  const sub = typeof body.sub === "string" ? body.sub : "";
  if (!iss.trim() || !sub.trim()) {
    return NextResponse.json(
      { error: "Body must include non-empty iss and sub strings" },
      { status: 400 }
    );
  }

  if (!isIssuerInAllowlist(iss)) {
    return NextResponse.json(
      {
        error: "Issuer not allowed",
        code: "issuer_not_allowed",
        detail: `Normalized iss was ${normalizeIssuerUrl(iss)}`,
      },
      { status: 403 }
    );
  }

  try {
    const { session: updated, cookie: newCookie } = bindOidcToSession(session, iss, sub);
    const response = NextResponse.json({
      ok: true,
      oidcIss: updated.oidcIss,
      oidcSub: updated.oidcSub,
      oidcClaimsAt: updated.oidcClaimsAt,
    });
    response.headers.set("Set-Cookie", newCookie);
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
