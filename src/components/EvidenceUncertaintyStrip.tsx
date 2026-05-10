"use client";

import {
  evidenceStatusOperatorCaption,
  evidenceStatusShortLabel,
  parseOptionalEvidenceStatus,
} from "@/lib/evidence-status";

type Props = Readonly<{
  evidenceStatus?: unknown;
  uncertaintySummary?: unknown;
  /** compact = single line in feed cards; relaxed = detail modal */
  variant?: "compact" | "relaxed";
}>;

/**
 * Shows optional ingress-declared evidence posture and uncertainty summary.
 * Renders nothing when both are absent or evidenceStatus is invalid.
 */
export default function EvidenceUncertaintyStrip({
  evidenceStatus,
  uncertaintySummary,
  variant = "compact",
}: Props) {
  const es = parseOptionalEvidenceStatus(evidenceStatus);
  const uncRaw = uncertaintySummary;
  const unc =
    typeof uncRaw === "string" && uncRaw.trim().length > 0 ? uncRaw.trim() : null;

  if (!es && !unc) return null;

  const isRelaxed = variant === "relaxed";

  return (
    <div
      className={
        isRelaxed
          ? "rounded-md border border-sky-200/90 bg-sky-50/80 px-3 py-2 text-xs text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-100"
          : "rounded border border-sky-200/80 bg-sky-50/60 px-2 py-1.5 text-[11px] leading-snug text-sky-950 dark:border-sky-800/50 dark:bg-sky-950/25 dark:text-sky-100"
      }
    >
      <div className="font-semibold uppercase tracking-wide text-sky-800/90 dark:text-sky-200/90">
        Evidence & uncertainty
      </div>
      {es ? (
        <div className={isRelaxed ? "mt-1.5" : "mt-1"}>
          <span className="font-medium text-sky-900 dark:text-sky-200">Evidence:</span>{" "}
          <span className="font-medium">{evidenceStatusShortLabel(es)}</span>
          {isRelaxed ? (
            <span className="mt-0.5 block text-sky-900/85 dark:text-sky-200/85">
              {evidenceStatusOperatorCaption(es)}
            </span>
          ) : null}
        </div>
      ) : null}
      {unc ? (
        <p className={isRelaxed ? "mt-2 text-sky-950/90 dark:text-sky-100/90" : "mt-1 text-sky-950/90 dark:text-sky-100/90"}>
          <span className="font-medium text-sky-900 dark:text-sky-200">Open questions / assumptions:</span> {unc}
        </p>
      ) : null}
    </div>
  );
}
