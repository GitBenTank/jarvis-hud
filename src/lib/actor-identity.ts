/**
 * Phase 1 — durable actor identity on proposals, approvals, execution, and receipts.
 * Placeholder until full auth: local human = "local-user", OpenClaw ingress = "openclaw".
 */

export type ActorType = "human" | "agent";

export type ActorRef = {
  actorId: string;
  actorType: ActorType;
  actorLabel?: string;
};

/** OpenClaw-signed ingress proposals */
export const ACTOR_OPENCLAW: ActorRef = {
  actorId: "openclaw",
  actorType: "agent",
  actorLabel: "OpenClaw",
};

/** UI approve / execute (no auth yet) */
export const ACTOR_LOCAL_USER: ActorRef = {
  actorId: "local-user",
  actorType: "human",
  actorLabel: "Local user",
};

export type ReceiptActors = {
  proposer: ActorRef;
  approver?: ActorRef;
  executor?: ActorRef;
};

/** Optional fields persisted on lifecycle events (events/*.json). */
export type ActorFieldsOnEvent = {
  actorId: string;
  actorType: ActorType;
  actorLabel?: string;
  approvalActorId?: string;
  approvalActorType?: ActorType;
  approvalActorLabel?: string;
  rejectionActorId?: string;
  rejectionActorType?: ActorType;
  rejectionActorLabel?: string;
  executionActorId?: string;
  executionActorType?: ActorType;
  executionActorLabel?: string;
};

export function agentActorFromAgentField(agent: string): ActorRef {
  const label = agent.trim() || "agent";
  const slug = label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 64);
  return {
    actorId: slug || "agent-unknown",
    actorType: "agent",
    actorLabel: label,
  };
}

export function buildReceiptActorsFromEvent(
  event: Partial<ActorFieldsOnEvent> & { agent?: string }
): ReceiptActors {
  const proposer: ActorRef =
    event.actorId && event.actorType
      ? {
          actorId: event.actorId,
          actorType: event.actorType,
          actorLabel: event.actorLabel,
        }
      : agentActorFromAgentField(event.agent ?? "unknown");

  const approver: ActorRef | undefined =
    event.approvalActorId && event.approvalActorType
      ? {
          actorId: event.approvalActorId,
          actorType: event.approvalActorType,
          actorLabel: event.approvalActorLabel,
        }
      : undefined;

  const executor: ActorRef | undefined =
    event.executionActorId && event.executionActorType
      ? {
          actorId: event.executionActorId,
          actorType: event.executionActorType,
          actorLabel: event.executionActorLabel,
        }
      : undefined;

  return { proposer, approver, executor };
}

/** Log warnings only — do not fail requests (legacy events). */
export function warnIfActorChainIncomplete(
  phase: "proposal" | "approval" | "execution" | "receipt",
  actors: ReceiptActors,
  opts?: { expectApprover?: boolean; expectExecutor?: boolean }
): void {
  if (!actors.proposer?.actorId) {
    console.warn(`[actor] ${phase}: missing proposer actorId (trace linkage weak)`);
  }
  if (opts?.expectApprover && !actors.approver?.actorId) {
    console.warn(`[actor] ${phase}: missing approver actorId`);
  }
  if (opts?.expectExecutor && !actors.executor?.actorId) {
    console.warn(`[actor] ${phase}: missing executor actorId`);
  }
}

export function formatActorLine(ref: ActorRef): string {
  return ref.actorLabel
    ? `${ref.actorLabel} (${ref.actorId} · ${ref.actorType})`
    : `${ref.actorId} (${ref.actorType})`;
}
