/**
 * Only allow http(s) URLs for target=_blank links from API/config.
 * Prevents odd browser behavior from unexpected schemes or empty strings.
 */
export function safeExternalHttpUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Same allowlist as {@link safeExternalHttpUrl}, then normalize to the OpenClaw
 * Control UI entry path when operators only configured an origin (matches
 * typical local URLs in https://docs.openclaw.ai/web/dashboard).
 */
export function openClawControlUiBrowserUrl(raw: string | null | undefined): string | null {
  const safe = safeExternalHttpUrl(raw);
  if (!safe) return null;
  try {
    const u = new URL(safe);
    const path = u.pathname.replace(/\/$/, "") || "/";
    if (path === "/") {
      u.pathname = "/overview";
    }
    return u.href.replace(/\/$/, "");
  } catch {
    return safe;
  }
}
