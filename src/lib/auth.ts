import { createHmac, randomBytes } from "node:crypto";

const AUTH_ENABLED = process.env.JARVIS_AUTH_ENABLED === "true";
const AUTH_SECRET = process.env.JARVIS_AUTH_SECRET ?? "dev-secret-change-in-production";
const COOKIE_NAME = "jarvis_session";
const STEP_UP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type Session = {
  id: string;
  createdAt: number;
  stepUpAt?: number;
};

export function isAuthEnabled(): boolean {
  return AUTH_ENABLED && AUTH_SECRET.length >= 16;
}

function sign(payload: string): string {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
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
    return obj;
  } catch {
    return null;
  }
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
