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
