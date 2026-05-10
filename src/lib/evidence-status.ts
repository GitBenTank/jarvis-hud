/**
 * Optional OpenClaw ingress fields: how strongly claims are grounded (epistemic posture).
 * @see docs/strategy/operating-assumptions.md (AI Index — evidence legibility)
 */

export const EVIDENCE_STATUS_VALUES = [
  "sourced",
  "inferred",
  "speculative",
  "user_provided",
  "unknown",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUS_VALUES)[number];

const STATUS_SET = new Set<string>(EVIDENCE_STATUS_VALUES);

/** Max length for optional one-line operator summary of unknowns / verification gaps. */
export const UNCERTAINTY_SUMMARY_MAX_CHARS = 280;

export function isEvidenceStatus(value: string): value is EvidenceStatus {
  return STATUS_SET.has(value);
}

/**
 * Parse a value stored on an approval event (defensive — ignore invalid legacy data).
 */
export function parseOptionalEvidenceStatus(raw: unknown): EvidenceStatus | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  return isEvidenceStatus(t) ? t : undefined;
}

/** Short operator-facing label for HUD badges. */
export function evidenceStatusShortLabel(status: EvidenceStatus): string {
  switch (status) {
    case "sourced":
      return "Sourced";
    case "inferred":
      return "Inferred";
    case "speculative":
      return "Speculative";
    case "user_provided":
      return "User-provided";
    case "unknown":
      return "Unknown epistemic state";
    default:
      return status;
  }
}

/** Longer line for detail modal (still one sentence). */
export function evidenceStatusOperatorCaption(status: EvidenceStatus): string {
  switch (status) {
    case "sourced":
      return "Claims are tied to cited or attached sources.";
    case "inferred":
      return "Some claims are inferred from sources; not every line is directly cited.";
    case "speculative":
      return "Hypothesis or exploratory content — treat as unverified.";
    case "user_provided":
      return "Material supplied by the user or upstream system — Jarvis has not verified it.";
    case "unknown":
      return "Proposer did not classify evidence posture.";
    default:
      return "";
  }
}

export function allowedEvidenceStatusListForDocs(): string {
  return EVIDENCE_STATUS_VALUES.join(", ");
}
