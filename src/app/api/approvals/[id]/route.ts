import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { randomUUID } from "node:crypto";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
  writeJson,
} from "@/lib/storage";
import { normalizeAction } from "@/lib/normalize";
import {
  isAuthEnabled,
  getSessionFromCookie,
  AuthConfigError,
} from "@/lib/auth";
import { resolveGovernedHumanPrincipal } from "@/lib/governed-human-principal";
import { assertSodApprovalAllowed, logSodPolicyDeny } from "@/lib/sod-rbac";
import {
  validateApprovalPreflightSnapshotWire,
  type ApprovalPreflightSnapshotWire,
} from "@/lib/approval-preflight-snapshot-shared";
import { appendApprovalPreflightSnapshot } from "@/lib/approval-preflight-snapshot-store";

type Event = {
  id: string;
  traceId?: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
  proposalStatus?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  actorId?: string;
  actorType?: "human" | "agent";
  actorLabel?: string;
  approvalActorId?: string;
  approvalActorType?: "human" | "agent";
  approvalActorLabel?: string;
  rejectionActorId?: string;
  rejectionActorType?: "human" | "agent";
  rejectionActorLabel?: string;
  approvalPrincipalIss?: string;
  approvalPrincipalSub?: string;
};

type ApprovalBody = { action: "approve" | "deny"; approvalPreflightSnapshot?: unknown };

function isApprovalBody(body: unknown): body is ApprovalBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return o.action === "approve" || o.action === "deny";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let authEnabled = false;
    try {
      authEnabled = isAuthEnabled();
    } catch (err) {
      if (err instanceof AuthConfigError) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      throw err;
    }

    const cookie = request.headers.get("cookie");
    const session = authEnabled ? getSessionFromCookie(cookie) : null;
    if (authEnabled && !session) {
      return NextResponse.json(
        { error: "Session required", code: "session_required" },
        { status: 401 }
      );
    }

    const humanRes = resolveGovernedHumanPrincipal(session, authEnabled);
    if (!humanRes.ok) {
      return NextResponse.json(
        { error: humanRes.error, code: humanRes.code },
        { status: humanRes.status }
      );
    }
    const human = humanRes.principal;

    const { id } = await params;

    const body = (await request.json()) as unknown;
    if (!isApprovalBody(body)) {
      return NextResponse.json(
        { error: "Invalid body: action must be 'approve' or 'deny'" },
        { status: 400 }
      );
    }

    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const events = await readJson<Event[]>(filePath);

    if (!events) {
      return NextResponse.json(
        { error: "Events not found" },
        { status: 404 }
      );
    }

    const index = events.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = events[index];
    if (event.requiresApproval !== true) {
      return NextResponse.json(
        { error: "Event does not require approval" },
        { status: 400 }
      );
    }
    if (event.status !== "pending") {
      return NextResponse.json(
        { error: "Event is not pending approval" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    let snapshotWire: ApprovalPreflightSnapshotWire | null = null;
    if (body.action === "approve" && Object.hasOwn(body, "approvalPreflightSnapshot")) {
      const expectedKind = normalizeAction(event.payload).kind;
      const v = validateApprovalPreflightSnapshotWire(
        body.approvalPreflightSnapshot,
        expectedKind
      );
      if (!v.ok) {
        return NextResponse.json({ error: v.error }, { status: 400 });
      }
      snapshotWire = v.wire;
    }

    const sodGate = assertSodApprovalAllowed(human);
    if (!sodGate.ok) {
      const traceId = String(event.traceId ?? event.id ?? "").trim();
      if (traceId) {
        await logSodPolicyDeny({
          traceId,
          rule: sodGate.policyRule,
          reason: sodGate.code,
        });
      }
      return NextResponse.json(
        { error: sodGate.message, code: sodGate.code },
        { status: sodGate.status }
      );
    }

    const approvalHumanFields =
      human.kind === "bound"
        ? {
            approvalActorId: human.actorId,
            approvalActorType: human.actorType,
            approvalActorLabel: human.actorLabel,
            approvalPrincipalIss: human.principalIss,
            approvalPrincipalSub: human.principalSub,
          }
        : {
            approvalActorId: human.actorId,
            approvalActorType: human.actorType,
            approvalActorLabel: human.actorLabel,
          };

    const rejectionHumanFields = {
      rejectionActorId: human.actorId,
      rejectionActorType: human.actorType,
      rejectionActorLabel: human.actorLabel,
    };

    const updated: Event = {
      ...event,
      status: body.action === "approve" ? "approved" : "denied",
      ...(body.action === "approve"
        ? {
            proposalStatus: "approved" as const,
            approvedAt: now,
            ...approvalHumanFields,
          }
        : {
            proposalStatus: "rejected" as const,
            rejectedAt: now,
            ...rejectionHumanFields,
          }),
    };
    events[index] = updated;
    await writeJson(filePath, events);

    if (snapshotWire) {
      await appendApprovalPreflightSnapshot(dateKey, {
        ...snapshotWire,
        id: randomUUID(),
        approvalId: id,
        traceId: event.traceId ?? event.id,
        capturedAt: now,
      });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
