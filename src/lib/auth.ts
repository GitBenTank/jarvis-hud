import { createHmac, randomBytes } from "node:crypto";

const AUTH_REQUESTED = process.env.JARVIS_AUTH_ENABLED === "true";
const COOKIE_NAME = "jarvis_session";
const STEP_UP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OIDC_ISS_LEN = 2048;
const MAX_OIDC_SUB_LEN = 1024;

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

export class IdentityBindingError extends Error {
  readonly code = "identity_binding_required" as const;
  constructor(message: string) {
    super(message);
    this.name = "IdentityBindingError";
  }
}

function getSecret(): string {
  if (!AUTH_REQUESTED) return "";
  const secret = process.env.JARVIS_AUTH_SECRET;
  if (!secret || typeof secret !== "string" || secret.length < 16) {
    throw new AuthConfigError(
      "Auth enabled but JARVIS_AUTH_SECRET is missing or invalid (min 16 chars required)"
    );
  }
  return secret;
}

export type Session = {
  id: string;
  createdAt: number;
  stepUpAt?: number;
  /** OIDC ID Token issuer (`iss`) — source-of-truth pair with `oidcSub` per identity-binding v1 contract */
  oidcIss?: string;
  /** OIDC subject (`sub`) */
  oidcSub?: string;
  /** Unix ms when `iss`/`sub` were validated and bound */
  oidcClaimsAt?: number;
};

export function isAuthEnabled(): boolean {
  if (!AUTH_REQUESTED) return false;
  try {
    getSecret();
    return true;
  } catch {
    throw new AuthConfigError(
      "Auth enabled but JARVIS_AUTH_SECRET is missing or invalid (min 16 chars required)"
    );
  }
}

function sign(payload: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new AuthConfigError(
      "Auth enabled but JARVIS_AUTH_SECRET is missing or invalid (min 16 chars required)"
    );
  }
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encode(obj: Session): string {
  const payload = Buffer.from(JSON.stringify(obj), "utf-8").toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decode(token: string): Session | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    if (sign(payload) !== sig) return null;
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    const obj = JSON.parse(json) as Session;
    if (!obj.id || typeof obj.createdAt !== "number") return null;
    return sanitizeDecodedOidcFields(obj);
  } catch {
    return null;
  }
}

/** Reject partial OIDC blobs on the cookie (fail closed). */
function sanitizeDecodedOidcFields(obj: Session): Session | null {
  const hasAny =
    obj.oidcIss !== undefined ||
    obj.oidcSub !== undefined ||
    obj.oidcClaimsAt !== undefined;
  if (!hasAny) return obj;
  if (
    typeof obj.oidcIss !== "string" ||
    typeof obj.oidcSub !== "string" ||
    typeof obj.oidcClaimsAt !== "number" ||
    !obj.oidcIss.trim() ||
    !obj.oidcSub.trim()
  ) {
    return null;
  }
  return obj;
}

export function getSessionFromCookie(cookieHeader: string | null): Session | null {
  if (!cookieHeader) return null;
  const match = new RegExp(`${COOKIE_NAME}=([^;]+)`).exec(cookieHeader);
  if (!match) return null;
  return decode(decodeURIComponent(match[1]));
}

export function createSession(): { session: Session; cookie: string } {
  const session: Session = {
    id: randomBytes(16).toString("hex"),
    createdAt: Date.now(),
  };
  const value = encode(session);
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`;
  return { session, cookie };
}

export function updateSessionStepUp(session: Session): { session: Session; cookie: string } {
  const updated: Session = { ...session, stepUpAt: Date.now() };
  const value = encode(updated);
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`;
  return { session: updated, cookie };
}

export function isStepUpValid(session: Session): boolean {
  if (!session.stepUpAt) return false;
  return Date.now() - session.stepUpAt < STEP_UP_TTL_MS;
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function isIdentityBindingRequired(): boolean {
  return process.env.JARVIS_IDENTITY_BINDING_REQUIRED === "true";
}

export function isOidcStubBindEnabled(): boolean {
  return process.env.JARVIS_OIDC_STUB_BIND === "true";
}

/** Normalize issuer string for allowlist comparison (trim, strip trailing slashes). */
export function normalizeIssuerUrl(iss: string): string {
  let s = iss.trim();
  while (s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

function parseIssuerAllowlist(): string[] {
  const raw = process.env.JARVIS_OIDC_ISSUER_ALLOWLIST ?? "";
  return raw
    .split(",")
    .map((s) => normalizeIssuerUrl(s))
    .filter(Boolean);
}

export function isIssuerInAllowlist(iss: string): boolean {
  const normalized = normalizeIssuerUrl(iss);
  const allow = parseIssuerAllowlist();
  return allow.includes(normalized);
}

export function sessionHasOidcBinding(session: Session): boolean {
  return Boolean(
    session.oidcIss?.trim() &&
      session.oidcSub?.trim() &&
      typeof session.oidcClaimsAt === "number"
  );
}

/**
 * When identity binding is required, step-up must not succeed without a bound OIDC principal.
 * @see docs/architecture/identity-binding-claims-contract-v1.md
 */
export function assertIdentityBindingForStepUp(session: Session): void {
  if (!isIdentityBindingRequired()) return;
  if (!sessionHasOidcBinding(session)) {
    throw new IdentityBindingError(
      "Identity binding required before step-up. Complete OIDC bind (e.g. POST /api/auth/oidc/stub-bind when JARVIS_OIDC_STUB_BIND is enabled)."
    );
  }
}

/**
 * Dev/test: bind validated `iss`/`sub` onto the current session (OIDC callback stub).
 * Caller must enforce stub flag and issuer allowlist (see route handler).
 */
export function bindOidcToSession(
  session: Session,
  iss: string,
  sub: string
): { session: Session; cookie: string } {
  const issTrim = iss.trim();
  const subTrim = sub.trim();
  if (!issTrim || !subTrim) {
    throw new Error("iss and sub are required");
  }
  if (issTrim.length > MAX_OIDC_ISS_LEN || subTrim.length > MAX_OIDC_SUB_LEN) {
    throw new Error("iss or sub exceeds maximum length");
  }
  const updated: Session = {
    ...session,
    oidcIss: issTrim,
    oidcSub: subTrim,
    oidcClaimsAt: Date.now(),
  };
  const value = encode(updated);
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`;
  return { session: updated, cookie };
}
