/**
 * Re-exports from risk.ts for backwards compatibility.
 * Canonical implementation: src/lib/risk.ts
 */

export {
  type RiskTier,
  riskTierForKind as getRiskTier,
  riskTierForKind,
  requiresIrreversibleConfirmation,
  getConfirmationPhrase,
  describeRiskNarrative,
} from "./risk";
