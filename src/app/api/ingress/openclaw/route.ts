import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
  writeJson,
} from "@/lib/storage";
import { isAllowedKind } from "@/lib/policy";
import {
  isIngressEnabled,
  getIngressSecret,
  evaluateTrustedIngress,
  buildSignatureMessage,
  verifyHmacSignature,
  isTimestampInWindow,
} from "@/lib/ingress-openclaw";
import { getNonceCache } from "@/lib/nonce-cache";
import { getIngressRateLimiter } from "@/lib/rate-limit";
import {
  validateRawBodySize,
  validateIngressBody,
} from "@/lib/ingress-schema";
import { validateOpenClawProposal } from "@/lib/ingress/validate-openclaw-proposal";
import { ALLOWED_KINDS } from "@/lib/policy";
import { getReasonDetail } from "@/lib/reason-taxonomy";
import { agentActorFromAgentField } from "@/lib/actor-identity";
import { resolveOpenClawLogicalAgent } from "@/lib/ingress/openclaw-proposal-identity";

type IngressEvent = {
  id: string;
  traceId: string;
  type: "proposed_action";
  agent: string;
  payload: Record<string, unknown>;
  requiresApproval: boolean;
  status: "pending";
  proposalStatus?: "pending_approval";
  createdAt: string;
  kind?: string;
  title?: string;
  summary?: string;
  correlationId?: string;
  source: {
    connector: string;
    receivedAt: string;
    verified: boolean;
    nonce: string;
    timestamp: string;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  trustedIngress: { ok: boolean; reasons: string[] };
  actorId: string;
  actorType: "human" | "agent";
  actorLabel?: string;
  /** Specialist that drafted the proposal (OpenClaw metadata only). */
  builder?: string;
  /** LLM provider label (e.g. openai); metadata only. */
  provider?: string;
  /** Model id string; metadata only. */
  model?: string;
};

type IngressBody = {
  kind: string;
  title: string;
  summary: string;
  payload?: Record<string, unknown>;
  patch?: string;
  source: {
    connector: string;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  correlationId?: string;
  /**
   * Logical proposing agent label for Jarvis UI (coordinator / operator-facing name).
   * If omitted, ingress uses {@link resolveOpenClawLogicalAgent} (`source.agentId` then sentinel).
   */
  agent?: string;
  /** Builder agent name (e.g. forge); optional. */
  builder?: string;
  provider?: string;
  model?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!isIngressEnabled()) {
      return NextResponse.json(
        { error: "Ingress disabled", reasonDetails: [getReasonDetail("POLICY_DENIED")] },
        { status: 403 }
      );
    }

    const secret = getIngressSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "Ingress secret missing or invalid" },
        { status: 403 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
      (forwarded?.split(",")[0]?.trim()) ||
      (request.headers.get("x-real-ip") ?? undefined) ||
      "unknown";
    const clientIp = ip || "unknown";

    const limiter = getIngressRateLimiter();
    const limitResult = limiter.check(clientIp);
    if (!limitResult.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: { "Retry-After": String(limitResult.retryAfterSec) },
        }
      );
    }

    const rawBody = await request.text();
    if (!rawBody.trim()) {
      return NextResponse.json(
        { error: "JSON body required", code: "EMPTY_BODY", field: "body" },
        { status: 400 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON", field: "body" },
        { status: 400 }
      );
    }

    const validateEnabled =
      process.env.JARVIS_INGRESS_OPENCLAW_VALIDATE !== "false";
    const maxBytes = 1024 * 1024;

    if (validateEnabled) {
      const v = validateOpenClawProposal({
        rawBody,
        parsed,
        maxBytes,
        allowedKinds: [...ALLOWED_KINDS],
      });
      if (!v.ok) {
        const status =
          v.code === "payload_too_large"
            ? 413
            : v.code === "unsupported_kind"
              ? 422
              : 400;
        return NextResponse.json(
          { error: v.message, field: v.field },
          { status }
        );
      }
    } else {
      const bodySizeErr = validateRawBodySize(rawBody);
      if (bodySizeErr) {
        return NextResponse.json(
          {
            error: bodySizeErr.message,
            code: bodySizeErr.code,
            field: bodySizeErr.field,
          },
          { status: 400 }
        );
      }
      const validation = validateIngressBody(parsed);
      if (!validation.ok) {
        const first = validation.errors[0];
        return NextResponse.json(
          {
            error: first?.message ?? "Validation failed",
            code: first?.code ?? "VALIDATION_ERROR",
            field: first?.field,
            errors: validation.errors,
          },
          { status: 400 }
        );
      }
    }
    const body = parsed as IngressBody;

    const timestamp = request.headers.get("x-jarvis-timestamp");
    const nonce = request.headers.get("x-jarvis-nonce");
    const signature = request.headers.get("x-jarvis-signature");

    if (!timestamp || !nonce || !signature) {
      return NextResponse.json(
        {
          error:
            "Missing headers: X-Jarvis-Timestamp, X-Jarvis-Nonce, X-Jarvis-Signature required",
        },
        { status: 400 }
      );
    }

    if (!isTimestampInWindow(timestamp)) {
      return NextResponse.json(
        {
          error: "Timestamp out of window (max 5 min past, 2 min future)",
          reasonDetails: [getReasonDetail("INGRESS_TIMESTAMP_INVALID")],
        },
        { status: 401 }
      );
    }

    const nonceCache = getNonceCache();
    if (nonceCache.has(nonce)) {
      return NextResponse.json(
        { error: "Nonce replay detected", reasonDetails: [getReasonDetail("INGRESS_NONCE_REPLAY")] },
        { status: 409 }
      );
    }

    const message = buildSignatureMessage(timestamp, nonce, rawBody);
    if (!verifyHmacSignature(secret, message, signature)) {
      return NextResponse.json(
        { error: "Invalid signature", reasonDetails: [getReasonDetail("INGRESS_SIGNATURE_INVALID")] },
        { status: 401 }
      );
    }

    nonceCache.add(nonce);

    const allowlist = evaluateTrustedIngress("openclaw");
    if (!allowlist.ok) {
      return NextResponse.json(
        {
          error: "Connector not in allowlist",
          reasons: allowlist.reasons,
          reasonDetails: [getReasonDetail("CONNECTOR_NOT_ALLOWLISTED")],
        },
        { status: 403 }
      );
    }

    if (!isAllowedKind(body.kind)) {
      return NextResponse.json(
        {
          error: `Kind "${body.kind}" not in execution allowlist`,
        },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const traceId = crypto.randomUUID();
    const receivedAt = new Date().toISOString();

    const FORBIDDEN_PAYLOAD_KEYS = [
      "status",
      "requiresApproval",
      "executedAt",
      "approvedAt",
      "traceId",
      "id",
      "agent",
      "builder",
      "provider",
      "model",
    ];
    const rawPayload =
      body.payload && typeof body.payload === "object" ? body.payload : {};
    const sanitized = Object.fromEntries(
      Object.entries(rawPayload).filter(
        ([k]) => !FORBIDDEN_PAYLOAD_KEYS.includes(k)
      )
    );

    const payload: Record<string, unknown> = {
      kind: body.kind,
      title: body.title,
      summary: body.summary,
      ...sanitized,
    };

    if (body.kind === "code.apply") {
      const patchFromBody = typeof body.patch === "string" ? body.patch : null;
      const patchFromPayload =
        sanitized.patch && typeof (sanitized as Record<string, unknown>).patch === "string"
          ? ((sanitized as Record<string, unknown>).patch as string)
          : null;
      const existingCode =
        payload.code && typeof payload.code === "object"
          ? (payload.code as Record<string, unknown>)
          : {};
      const diffText =
        typeof (existingCode as Record<string, unknown>).diffText === "string"
          ? ((existingCode as Record<string, unknown>).diffText as string)
          : patchFromBody ?? patchFromPayload ?? "";

      payload.code = {
        ...(existingCode as Record<string, unknown>),
        diffText: diffText.trim(),
        summary:
          typeof (existingCode as Record<string, unknown>).summary === "string"
            ? (existingCode as Record<string, unknown>).summary
            : body.summary,
      };
      delete (payload as Record<string, unknown>).patch;
    }

    const bodySource = (body.source && typeof body.source === "object"
      ? body.source
      : {}) as Record<string, unknown>;

    const sourceAgentIdStr =
      typeof bodySource.agentId === "string" && bodySource.agentId.trim()
        ? bodySource.agentId.trim()
        : undefined;

    /**
     * Logical proposer for UI + actor derivation — never a silent `"openclaw"` default.
     * See `resolveOpenClawLogicalAgent` in `@/lib/ingress/openclaw-proposal-identity`.
     */
    const logicalAgent = resolveOpenClawLogicalAgent(body.agent, sourceAgentIdStr);

    const builderName =
      typeof body.builder === "string" && body.builder.trim()
        ? body.builder.trim()
        : undefined;
    const providerName =
      typeof body.provider === "string" && body.provider.trim()
        ? body.provider.trim()
        : undefined;
    const modelName =
      typeof body.model === "string" && body.model.trim()
        ? body.model.trim()
        : undefined;

    const proposerActor = agentActorFromAgentField(logicalAgent);

    const event: IngressEvent = {
      id,
      traceId,
      type: "proposed_action",
      agent: logicalAgent,
      payload,
      requiresApproval: true,
      status: "pending",
      proposalStatus: "pending_approval",
      createdAt: receivedAt,
      kind: body.kind,
      title: body.title,
      summary: body.summary,
      ...(typeof body.correlationId === "string" && body.correlationId.trim()
        ? { correlationId: body.correlationId.trim() }
        : {}),
      ...(builderName ? { builder: builderName } : {}),
      ...(providerName ? { provider: providerName } : {}),
      ...(modelName ? { model: modelName } : {}),
      source: {
        connector: "openclaw",
        receivedAt,
        verified: true,
        nonce,
        timestamp,
        ...(typeof bodySource.sessionId === "string" ? { sessionId: bodySource.sessionId } : {}),
        ...(sourceAgentIdStr ? { agentId: sourceAgentIdStr } : {}),
        ...(typeof bodySource.requestId === "string" ? { requestId: bodySource.requestId } : {}),
      },
      trustedIngress: { ok: true, reasons: [] },
      actorId: proposerActor.actorId,
      actorType: proposerActor.actorType,
      actorLabel: proposerActor.actorLabel,
    };

    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const existing = await readJson<IngressEvent[]>(filePath);
    const events = [...(existing ?? []), event];
    await writeJson(filePath, events);

    return NextResponse.json({
      ok: true,
      id,
      traceId,
      status: "pending",
    });
  } catch (err: unknown) {
    console.error("[ingress/openclaw]", (err as Error)?.message ?? "Unknown error");
    return NextResponse.json(
      { error: "Failed to process ingress" },
      { status: 500 }
    );
  }
}
