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

type IngressEvent = {
  id: string;
  traceId: string;
  type: "proposed_action";
  agent: string;
  payload: Record<string, unknown>;
  requiresApproval: boolean;
  status: "pending";
  createdAt: string;
  kind?: string;
  title?: string;
  summary?: string;
  source: {
    connector: string;
    receivedAt: string;
    verified: boolean;
    nonce: string;
    timestamp: string;
  };
  trustedIngress: { ok: boolean; reasons: string[] };
};

type IngressBody = {
  kind: string;
  title: string;
  summary: string;
  payload?: Record<string, unknown>;
  source: { connector: string };
};

function isIngressBody(body: unknown): body is IngressBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  const src = o.source;
  if (!src || typeof src !== "object") return false;
  const srcObj = src as Record<string, unknown>;
  return (
    typeof o.kind === "string" &&
    typeof o.title === "string" &&
    typeof o.summary === "string" &&
    (o.payload === undefined || (typeof o.payload === "object" && o.payload !== null)) &&
    srcObj.connector === "openclaw"
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isIngressEnabled()) {
      return NextResponse.json({ error: "Ingress disabled" }, { status: 403 });
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
        { error: "JSON body required" },
        { status: 400 }
      );
    }

    let body: IngressBody;
    try {
      body = JSON.parse(rawBody) as IngressBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

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
        { error: "Timestamp out of window (max 5 min past, 2 min future)" },
        { status: 401 }
      );
    }

    const nonceCache = getNonceCache();
    if (nonceCache.has(nonce)) {
      return NextResponse.json(
        { error: "Nonce replay detected" },
        { status: 409 }
      );
    }

    const message = buildSignatureMessage(timestamp, nonce, rawBody);
    if (!verifyHmacSignature(secret, message, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    nonceCache.add(nonce);

    const allowlist = evaluateTrustedIngress("openclaw");
    if (!allowlist.ok) {
      return NextResponse.json(
        { error: "Connector not in allowlist", reasons: allowlist.reasons },
        { status: 403 }
      );
    }

    if (!isIngressBody(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid body: kind, title, summary, payload (object), and source.connector=openclaw required",
        },
        { status: 400 }
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

    const event: IngressEvent = {
      id,
      traceId,
      type: "proposed_action",
      agent: "openclaw",
      payload,
      requiresApproval: true,
      status: "pending",
      createdAt: receivedAt,
      kind: body.kind,
      title: body.title,
      summary: body.summary,
      source: {
        connector: "openclaw",
        receivedAt,
        verified: true,
        nonce,
        timestamp,
      },
      trustedIngress: { ok: true, reasons: [] },
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
