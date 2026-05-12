/**
 * When Activity diagnostics `<details>` should start **open** so operators
 * do not miss trust / ingress / posture problems. Default remains closed only
 * when signals look healthy (integration clear + receive path + auth step-up OK).
 */

export function shouldOpenActivityDiagnosticsDisclosure(json: unknown): boolean {
  if (json === null || json === undefined) return true;
  if (typeof json !== "object") return true;

  const o = json as Record<string, unknown>;

  const issues = o.integrationIssues;
  if (Array.isArray(issues) && issues.length > 0) return true;

  if (o.ingressOpenclawEnabled === false) return true;
  if (o.openclawAllowed === false) return true;

  const authEnabled = o.authEnabled === true;
  const tp = o.trustPosture;
  if (tp && typeof tp === "object") {
    const t = tp as Record<string, unknown>;
    if (authEnabled && t.stepUpValid === false) return true;
    if (t.sodEnabled === true && t.sodRoleMapsReady === false) return true;
  }

  const rp = o.runtimePosture;
  if (rp && typeof rp === "object") {
    const r = rp as Record<string, unknown>;
    const block = r.latestBlockReason;
    if (typeof block === "string" && block.trim().length > 0) return true;
  }

  const probe = o.openclawControlUiProbe;
  if (probe && typeof probe === "object") {
    const p = probe as Record<string, unknown>;
    if (p.ok === false) return true;
  }

  return false;
}
