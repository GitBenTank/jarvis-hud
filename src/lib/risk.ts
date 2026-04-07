/**
 * Risk tier for proposal kinds. Used for irreversible action confirmation.
 * UI-only gating; backend unchanged.
 * Feature-flagged via JARVIS_UI_CONFIRM_IRREVERSIBLE.
 */

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskLevel = "low" | "medium" | "high";

export function riskTierForKind(kind: string): RiskTier {
  if (kind === "code.apply") return "CRITICAL";
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
  return "CONFIRM";
}

export function getRiskLevel(kind: string): RiskLevel {
  if (kind === "code.apply") return "high";
  if (kind === "code.diff" || kind.startsWith("recovery.")) return "medium";
  return "low";
}
