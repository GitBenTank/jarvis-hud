/**
 * A6 — catch drift when new App Router API modules ship without updating the manifest.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const apiRoot = path.join(repoRoot, "src/app/api");

function collectRouteTsRelativePaths(dir: string, acc: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) collectRouteTsRelativePaths(full, acc);
    else if (st.isFile() && name === "route.ts") {
      acc.push(path.relative(repoRoot, full).split(path.sep).join("/"));
    }
  }
  return acc;
}

/** Every `src/app/api` `route.ts` file — keep sorted; add a line when you add an API route. */
const API_ROUTE_MANIFEST: readonly string[] = [
  "src/app/api/actions/route.ts",
  "src/app/api/activity/stream/route.ts",
  "src/app/api/alfred/status/route.ts",
  "src/app/api/approvals/[id]/preflight-snapshot/route.ts",
  "src/app/api/approvals/[id]/route.ts",
  "src/app/api/approvals/route.ts",
  "src/app/api/audit/export/route.ts",
  "src/app/api/auth/init/route.ts",
  "src/app/api/auth/oidc/stub-bind/route.ts",
  "src/app/api/auth/status/route.ts",
  "src/app/api/auth/step-up/route.ts",
  "src/app/api/config/route.ts",
  "src/app/api/connectors/openclaw/health/route.ts",
  "src/app/api/drafts/content/route.ts",
  "src/app/api/events/route.ts",
  "src/app/api/execute/[approvalId]/route.ts",
  "src/app/api/incidents/route.ts",
  "src/app/api/ingress/openclaw/route.ts",
  "src/app/api/os/open/route.ts",
  "src/app/api/preflight/route.ts",
  "src/app/api/proof-path/route.ts",
  "src/app/api/recovery/verify/route.ts",
  "src/app/api/reflections/route.ts",
  "src/app/api/reset/today/route.ts",
  "src/app/api/traces/[traceId]/replay/route.ts",
  "src/app/api/traces/[traceId]/route.ts",
  "src/app/api/traces/recent/route.ts",
].sort();

describe("api route surface manifest", () => {
  it("matches every route.ts under src/app/api", () => {
    const discovered = collectRouteTsRelativePaths(apiRoot).sort();
    const manifestSet = new Set(API_ROUTE_MANIFEST);
    const discoveredSet = new Set(discovered);

    const missingFromManifest = discovered.filter((p) => !manifestSet.has(p));
    const staleInManifest = API_ROUTE_MANIFEST.filter((p) => !discoveredSet.has(p));

    expect(missingFromManifest).toEqual(
      [],
      `Add these paths to API_ROUTE_MANIFEST in api-route-surface-manifest.test.ts:\n${missingFromManifest.join("\n")}`
    );

    expect(staleInManifest).toEqual(
      [],
      `Remove stale paths from API_ROUTE_MANIFEST (no matching file):\n${staleInManifest.join("\n")}`
    );
  });
});
