/**
 * Backend execution gate — validates approval chain before any adapter runs.
 * Single choke point: POST /api/execute/[approvalId]
 */

export type ExecutionGateCode =
  | "events_unavailable"
  | "proposal_not_found"
  | "proposal_not_approved"
  | "missing_approval"
  | "already_executed"
  | "missing_trace_id"
  | "missing_actor_chain"
  | "missing_approval_actor";

export type ExecutionGateEvent = {
  id: string;
  traceId?: string;
  requiresApproval?: boolean;
  status: string;
  executed?: boolean;
  actorId?: string;
  actorType?: "human" | "agent";
  approvalActorId?: string;
  approvalActorType?: "human" | "agent";
};

export type ExecutionGateOk = { ok: true; traceId: string };
export type ExecutionGateFail = {
  ok: false;
  code: ExecutionGateCode;
  message: string;
  status: number;
};
export type ExecutionGateResult = ExecutionGateOk | ExecutionGateFail;

export function validateExecutionPreconditions(args: {
  event: ExecutionGateEvent | null | undefined;
  approvalId: string;
}): ExecutionGateResult {
  const { event, approvalId } = args;

  if (!event) {
    return {
      ok: false,
      code: "proposal_not_found",
      message: "No proposal exists for this approval id",
      status: 404,
    };
  }

  if (event.id !== approvalId) {
    return {
      ok: false,
      code: "proposal_not_found",
      message: "Approval id does not match loaded event",
      status: 404,
    };
  }

  if (event.executed === true) {
    return {
      ok: false,
      code: "already_executed",
      message: "This proposal has already been executed",
      status: 409,
    };
  }

  if (event.status !== "approved") {
    return {
      ok: false,
      code: "proposal_not_approved",
      message: "Event is not approved; execution is not allowed",
      status: 400,
    };
  }

  if (event.requiresApproval !== true) {
    return {
      ok: false,
      code: "missing_approval",
      message: "Event did not require approval; execution blocked",
      status: 400,
    };
  }

  const traceId = String(event.traceId ?? event.id ?? "").trim();
  if (!traceId) {
    return {
      ok: false,
      code: "missing_trace_id",
      message: "Proposal has no traceId; cannot execute",
      status: 400,
    };
  }

  if (!event.actorId?.trim() || !event.actorType) {
    return {
      ok: false,
      code: "missing_actor_chain",
      message: "Proposal is missing proposer actorId or actorType",
      status: 400,
    };
  }

  if (!event.approvalActorId?.trim() || !event.approvalActorType) {
    return {
      ok: false,
      code: "missing_approval_actor",
      message: "No recorded approval actor; approve again from the UI",
      status: 400,
    };
  }

  return { ok: true, traceId };
}

export function logExecutionGateFailure(args: {
  code: ExecutionGateCode;
  approvalId: string;
  traceId?: string;
  detail?: string;
}): void {
  const tid = args.traceId ? ` traceId=${args.traceId}` : "";
  const extra = args.detail ? ` ${args.detail}` : "";
  console.warn(
    `[execute-gate] blocked code=${args.code} approvalId=${args.approvalId}${tid}${extra}`
  );
}
