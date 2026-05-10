/**
 * Resolves the human principal for approve / execute persistence (identity binding S2).
 * @see docs/architecture/identity-binding-claims-contract-v1.md
 */

import { createHash } from "node:crypto";
import type { Session } from "@/lib/auth";
import {
  isIdentityBindingRequired,
  sessionHasOidcBinding,
} from "@/lib/auth";
import { ACTOR_LOCAL_USER } from "@/lib/actor-identity";

/** Deterministic opaque id from validated `(iss, sub)` — not authoritative over persisted iss/sub. */
export function deriveOidcPrincipalActorId(iss: string, sub: string): string {
  const digest = createHash("sha256").update(`${iss}\0${sub}`, "utf8").digest("hex");
  return `oidc1:${digest}`;
}

/** Display label when session only carries OIDC claims (no preferred_username yet). */
export function humanLabelFromOidcSession(session: Session): string {
  const sub = session.oidcSub?.trim();
  return sub && sub.length > 0 ? sub : "oidc-user";
}

export type GovernedHumanPrincipalBound = {
  kind: "bound";
  actorId: string;
  actorType: "human";
  actorLabel: string;
  principalIss: string;
  principalSub: string;
};

export type GovernedHumanPrincipalLocal = {
  kind: "local";
  actorId: string;
  actorType: "human";
  actorLabel: string;
};

export type GovernedHumanPrincipal =
  | GovernedHumanPrincipalBound
  | GovernedHumanPrincipalLocal;

export type GovernedHumanPrincipalError = {
  ok: false;
  status: 401 | 403;
  error: string;
  code: string;
};

export type GovernedHumanPrincipalResult =
  | { ok: true; principal: GovernedHumanPrincipal }
  | GovernedHumanPrincipalError;

/**
 * Resolve who to persist as the human actor for approve / execute / receipts.
 * When auth is off, always local placeholder. When auth is on, session is required.
 * When identity binding is required, session must carry OIDC iss/sub (fail closed).
 */
export function resolveGovernedHumanPrincipal(
  session: Session | null,
  authEnabled: boolean
): GovernedHumanPrincipalResult {
  if (!authEnabled) {
    return {
      ok: true,
      principal: {
        kind: "local",
        actorId: ACTOR_LOCAL_USER.actorId,
        actorType: "human",
        actorLabel: ACTOR_LOCAL_USER.actorLabel ?? "Local user",
      },
    };
  }

  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Session required",
      code: "session_required",
    };
  }

  if (isIdentityBindingRequired()) {
    if (!sessionHasOidcBinding(session)) {
      return {
        ok: false,
        status: 403,
        error:
          "Identity binding required. Complete OIDC bind (e.g. POST /api/auth/oidc/stub-bind) before approve or execute.",
        code: "identity_binding_required",
      };
    }
    const iss = session.oidcIss!.trim();
    const sub = session.oidcSub!.trim();
    return {
      ok: true,
      principal: {
        kind: "bound",
        actorId: deriveOidcPrincipalActorId(iss, sub),
        actorType: "human",
        actorLabel: humanLabelFromOidcSession(session),
        principalIss: iss,
        principalSub: sub,
      },
    };
  }

  if (sessionHasOidcBinding(session)) {
    const iss = session.oidcIss!.trim();
    const sub = session.oidcSub!.trim();
    return {
      ok: true,
      principal: {
        kind: "bound",
        actorId: deriveOidcPrincipalActorId(iss, sub),
        actorType: "human",
        actorLabel: humanLabelFromOidcSession(session),
        principalIss: iss,
        principalSub: sub,
      },
    };
  }

  return {
    ok: true,
    principal: {
      kind: "local",
      actorId: ACTOR_LOCAL_USER.actorId,
      actorType: "human",
      actorLabel: ACTOR_LOCAL_USER.actorLabel ?? "Local user",
    },
  };
}
