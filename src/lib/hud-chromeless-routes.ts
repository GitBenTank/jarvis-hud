/**
 * Routes where operator/integration top banners are hidden for a clean surface
 * (investor-style / reading modes).
 */
export function isHudChromelessPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/demo" || pathname.startsWith("/demo/")) return true;
  if (pathname === "/docs" || pathname.startsWith("/docs/")) return true;
  return false;
}
