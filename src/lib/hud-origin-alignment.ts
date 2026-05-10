/**
 * HUD viewed origin vs configured `JARVIS_HUD_BASE_URL` — local loopback equivalence.
 * Browsers treat `localhost` and `127.0.0.1` as different origins; for operator UX we still
 * flag true mismatches, but treat same-scheme + same-port loopback aliases as aligned in dev.
 */

/** Same-machine loopback hostnames only (not LAN IPs). */
export function isLoopbackHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

/**
 * True when origins match, or when both are loopback with the same scheme and port
 * (e.g. http://localhost:3000 vs http://127.0.0.1:3000).
 */
export function originsAlignedForLocalHud(viewedOrigin: string, configuredOrigin: string): boolean {
  if (viewedOrigin === configuredOrigin) return true;
  try {
    const v = new URL(viewedOrigin);
    const c = new URL(configuredOrigin);
    if (v.protocol !== c.protocol) return false;
    if (v.port !== c.port) return false;
    if (!isLoopbackHostname(v.hostname) || !isLoopbackHostname(c.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
