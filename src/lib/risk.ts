/**
 * Risk tier for proposal kinds. Used for irreversible action confirmation.
 * UI-only gating; backend unchanged.
 * Feature-flagged via JARVIS_UI_CONFIRM_IRREVERSIBLE.
 */

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskLevel = "low" | "medium" | "high";

export function riskTierForKind(kind: string): RiskTier {
  if (kind === "code.apply") return "CRITICAL";
  if (kind === "send_email") return "HIGH";
  return "LOW";
}

export function requiresIrreversibleConfirmation(kind: string): boolean {
  return (
    riskTierForKind(kind) === "HIGH" || riskTierForKind(kind) === "CRITICAL"
  );
}

/**
 * Phrase the user must type to confirm execution.
 */
export function getConfirmationPhrase(kind: string): string {
  if (kind === "code.apply") return "APPLY";
  if (kind === "send_email") return "SEND";
  return "CONFIRM";
}

export function getRiskLevel(kind: string): RiskLevel {
  if (kind === "code.apply" || kind === "send_email") return "high";
  if (kind === "code.diff" || kind.startsWith("recovery.")) return "medium";
  return "low";
}

/**
 * Operator-facing line for approval UI (aligned with getRiskLevel tiers).
 */
export function describeRiskNarrative(kind: string): string {
  const level = getRiskLevel(kind);
  if (kind === "send_email") {
    return "High risk: sends one real outbound email to the allowlisted demo recipient after Execute.";
  }
  if (level === "high") {
    return "High risk: modifies repository state (working tree and may create a local commit).";
  }
  if (level === "medium") {
    return "Medium risk: modifies stored state (artifacts, receipts, or local files).";
  }
  return "Low risk: note or local artifact only; no git repository mutation.";
}
