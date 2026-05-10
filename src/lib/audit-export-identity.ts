/**
 * Identity binding read surfaces for audit export and trace replay.
 * When JARVIS_IDENTITY_BINDING_REQUIRED=true, fail closed if stored rows would
 * imply a human approver/executor without persisted OIDC principal fields.
 */

import { isIdentityBindingRequired } from "./auth";
import { ACTOR_LOCAL_USER } from "./actor-identity";

export const AUDIT_EXPORT_IDENTITY_INTEGRITY_CODE = "identity_binding_integrity";

export class AuditExportIdentityIntegrityError extends Error {
  readonly code = AUDIT_EXPORT_IDENTITY_INTEGRITY_CODE;
  readonly httpStatus = 409;

  constructor(message: string) {
    super(message);
    this.name = "AuditExportIdentityIntegrityError";
  }
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export type AuditPrincipalBlock = {
  actorId?: unknown;
  actorType?: unknown;
  actorLabel?: unknown;
  principalIss?: unknown;
  principalSub?: unknown;
};

export type EventHumanPrincipalsForExport = {
  /** Human/agent ref plus OIDC principal when bound (who approved). */
  approval?: AuditPrincipalBlock | null;
  /** Who executed (may match approval for same human). */
  execution?: AuditPrincipalBlock | null;
};

function isMisleadingLocalHumanActor(actorId: unknown, actorType: unknown): boolean {
  if (actorId === ACTOR_LOCAL_USER.actorId) return true;
  return actorType === "human";
}

/** Same shape as `humanPrincipals` on export rows — reused by trace replay. */
export function humanPrincipalsFromLifecycleFields(
  o: Record<string, unknown>
): EventHumanPrincipalsForExport | null {
  const approval =
    o.approvalActorId != null ||
    o.approvalActorType != null ||
    o.approvalPrincipalIss != null ||
    o.approvalPrincipalSub != null
      ? {
          actorId: o.approvalActorId,
          actorType: o.approvalActorType,
          actorLabel: o.approvalActorLabel,
          principalIss: o.approvalPrincipalIss,
          principalSub: o.approvalPrincipalSub,
        }
      : undefined;

  const execution =
    o.executionActorId != null ||
    o.executionActorType != null ||
    o.executionPrincipalIss != null ||
    o.executionPrincipalSub != null
      ? {
          actorId: o.executionActorId,
          actorType: o.executionActorType,
          actorLabel: o.executionActorLabel,
          principalIss: o.executionPrincipalIss,
          principalSub: o.executionPrincipalSub,
        }
      : undefined;

  if (!approval && !execution) return null;
  return {
    ...(approval ? { approval } : {}),
    ...(execution ? { execution } : {}),
  };
}

/**
 * Adds `humanPrincipals` so exports clearly separate approver vs executor
 * without removing raw `approvalPrincipal*` / `executionPrincipal*` fields.
 */
export function augmentAuditExportEvent(ev: unknown): unknown {
  if (!ev || typeof ev !== "object") return ev;
  const o = ev as Record<string, unknown>;
  const humanPrincipals = humanPrincipalsFromLifecycleFields(o);
  if (!humanPrincipals) return ev;
  return { ...o, humanPrincipals };
}

function eventRecordApproved(o: Record<string, unknown>): boolean {
  if (o.status === "approved") return true;
  return nonEmptyString(o.approvedAt);
}

/**
 * Validates stored lifecycle rows when identity binding is required.
 * Throws {@link AuditExportIdentityIntegrityError} on violation.
 */
export function validateEventsForIdentityBindingExport(events: unknown[]): void {
  if (!isIdentityBindingRequired()) return;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (!ev || typeof ev !== "object") continue;
    const o = ev as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `row[${i}]`;

    if (typeof o.rejectedAt === "string" && o.rejectedAt.trim()) continue;

    if (eventRecordApproved(o)) {
      const hasApproverSlot =
        o.approvalActorId != null ||
        o.approvalActorType != null ||
        o.approvalPrincipalIss != null ||
        o.approvalPrincipalSub != null;

      if (
        hasApproverSlot &&
        isMisleadingLocalHumanActor(o.approvalActorId, o.approvalActorType)
      ) {
        if (!nonEmptyString(o.approvalPrincipalIss) || !nonEmptyString(o.approvalPrincipalSub)) {
          throw new AuditExportIdentityIntegrityError(
            `Event ${id}: approval references a human actor but is missing approvalPrincipalIss/approvalPrincipalSub while identity binding is required`
          );
        }
      }
    }

    if (o.executed === true) {
      const hasExecutorSlot =
        o.executionActorId != null ||
        o.executionActorType != null ||
        o.executionPrincipalIss != null ||
        o.executionPrincipalSub != null;

      if (
        hasExecutorSlot &&
        isMisleadingLocalHumanActor(o.executionActorId, o.executionActorType)
      ) {
        if (!nonEmptyString(o.executionPrincipalIss) || !nonEmptyString(o.executionPrincipalSub)) {
          throw new AuditExportIdentityIntegrityError(
            `Event ${id}: execution references a human actor but is missing executionPrincipalIss/executionPrincipalSub while identity binding is required`
          );
        }
      }
    }
  }
}
