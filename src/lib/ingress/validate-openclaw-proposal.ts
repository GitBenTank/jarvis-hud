/**
 * Strict proposal validation for OpenClaw ingress.
 * Feature-flagged via JARVIS_INGRESS_OPENCLAW_VALIDATE.
 */

import { parseSendEmailPayload } from "../send-email-constants";

export type ValidationOk = { ok: true };

export type ValidationErr = {
  ok: false;
  code: "bad_request" | "payload_too_large" | "unsupported_kind";
  message: string;
  field?: string;
};

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "kind",
  "title",
  "summary",
  "markdown",
  "payload",
  "patch",
  "source",
  "confidence",
  "correlationId",
  /** OpenClaw coordinator / builder / LLM labels (metadata only; optional strings). */
  "agent",
  "builder",
  "provider",
  "model",
  /** Review-container metadata (validated in route via `strictValidateIngressBatch`). */
  "batch",
]);

/** Max length for optional coordinator, builder, provider strings. */
const AGENT_METADATA_MAX_LEN = 64;
/** Max length for optional model id string (e.g. `openai/gpt-4o`). */
const MODEL_METADATA_MAX_LEN = 128;
/** Max length for `source.agentId` (upstream runtime identity). */
const SOURCE_AGENT_ID_MAX_LEN = 128;
/** Max length for `payload.note` on `system.note`. */
const SYSTEM_NOTE_MAX_LEN = 50_000;

const BINARY_PATCH_MARKERS = ["GIT binary patch", "literal "];
const VALID_PATCH_MARKERS = ["diff --git"];
const VALID_PATCH_ALTERNATIVE = { prefix: "--- ", suffix: "+++ " };

export function validateOpenClawProposal(input: {
  rawBody: string;
  parsed: unknown;
  maxBytes: number;
  allowedKinds: string[];
}): ValidationOk | ValidationErr {
  const { rawBody, parsed, maxBytes, allowedKinds } = input;

  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    return {
      ok: false,
      code: "payload_too_large",
      message: `Request body exceeds ${maxBytes} bytes`,
      field: "body",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      code: "bad_request",
      message: "Body must be a JSON object",
      field: "body",
    };
  }

  const o = parsed as Record<string, unknown>;

  for (const key of Object.keys(o)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      return {
        ok: false,
        code: "bad_request",
        message: `Unknown field: ${key}`,
        field: key,
      };
    }
  }

  if (typeof o.kind !== "string") {
    return {
      ok: false,
      code: "bad_request",
      message: "kind is required",
      field: "kind",
    };
  }

  if (!allowedKinds.includes(o.kind)) {
    return {
      ok: false,
      code: "unsupported_kind",
      message: `Kind "${o.kind}" is not allowed`,
      field: "kind",
    };
  }

  if (typeof o.title !== "string") {
    return {
      ok: false,
      code: "bad_request",
      message: "title is required",
      field: "title",
    };
  }

  if (o.title.length > 120) {
    return {
      ok: false,
      code: "bad_request",
      message: "title must be ≤ 120 chars",
      field: "title",
    };
  }

  if (typeof o.summary !== "string") {
    return {
      ok: false,
      code: "bad_request",
      message: "summary is required",
      field: "summary",
    };
  }

  if (o.summary.length > 500) {
    return {
      ok: false,
      code: "bad_request",
      message: "summary must be ≤ 500 chars",
      field: "summary",
    };
  }

  const source = o.source;
  if (!source || typeof source !== "object") {
    return {
      ok: false,
      code: "bad_request",
      message: "source is required",
      field: "source",
    };
  }

  const srcObj = source as Record<string, unknown>;
  if (srcObj.connector !== "openclaw") {
    return {
      ok: false,
      code: "bad_request",
      message: "source.connector must be 'openclaw'",
      field: "source.connector",
    };
  }

  if (o.correlationId !== undefined && typeof o.correlationId !== "string") {
    return {
      ok: false,
      code: "bad_request",
      message: "correlationId must be a string when provided",
      field: "correlationId",
    };
  }

  if (o.agent !== undefined) {
    if (typeof o.agent !== "string") {
      return {
        ok: false,
        code: "bad_request",
        message: "agent must be a string when provided",
        field: "agent",
      };
    }
    if (o.agent.length > AGENT_METADATA_MAX_LEN) {
      return {
        ok: false,
        code: "bad_request",
        message: `agent must be ≤ ${AGENT_METADATA_MAX_LEN} chars`,
        field: "agent",
      };
    }
  }

  if (o.builder !== undefined) {
    if (typeof o.builder !== "string") {
      return {
        ok: false,
        code: "bad_request",
        message: "builder must be a string when provided",
        field: "builder",
      };
    }
    if (o.builder.length > AGENT_METADATA_MAX_LEN) {
      return {
        ok: false,
        code: "bad_request",
        message: `builder must be ≤ ${AGENT_METADATA_MAX_LEN} chars`,
        field: "builder",
      };
    }
  }

  if (o.provider !== undefined) {
    if (typeof o.provider !== "string") {
      return {
        ok: false,
        code: "bad_request",
        message: "provider must be a string when provided",
        field: "provider",
      };
    }
    if (o.provider.length > AGENT_METADATA_MAX_LEN) {
      return {
        ok: false,
        code: "bad_request",
        message: `provider must be ≤ ${AGENT_METADATA_MAX_LEN} chars`,
        field: "provider",
      };
    }
  }

  if (o.model !== undefined) {
    if (typeof o.model !== "string") {
      return {
        ok: false,
        code: "bad_request",
        message: "model must be a string when provided",
        field: "model",
      };
    }
    if (o.model.length > MODEL_METADATA_MAX_LEN) {
      return {
        ok: false,
        code: "bad_request",
        message: `model must be ≤ ${MODEL_METADATA_MAX_LEN} chars`,
        field: "model",
      };
    }
  }

  for (const k of ["sessionId", "requestId"] as const) {
    const v = srcObj[k];
    if (v !== undefined && typeof v !== "string") {
      return {
        ok: false,
        code: "bad_request",
        message: `source.${k} must be a string when provided`,
        field: `source.${k}`,
      };
    }
    if (typeof v === "string" && v.length > AGENT_METADATA_MAX_LEN) {
      return {
        ok: false,
        code: "bad_request",
        message: `source.${k} must be ≤ ${AGENT_METADATA_MAX_LEN} chars`,
        field: `source.${k}`,
      };
    }
  }

  const sourceAgentId = srcObj.agentId;
  if (sourceAgentId !== undefined) {
    if (typeof sourceAgentId !== "string") {
      return {
        ok: false,
        code: "bad_request",
        message: "source.agentId must be a string when provided",
        field: "source.agentId",
      };
    }
    if (sourceAgentId.length > SOURCE_AGENT_ID_MAX_LEN) {
      return {
        ok: false,
        code: "bad_request",
        message: `source.agentId must be ≤ ${SOURCE_AGENT_ID_MAX_LEN} chars`,
        field: "source.agentId",
      };
    }
  }

  if (o.markdown !== undefined && typeof o.markdown === "string") {
    if (o.markdown.length > 20_000) {
      return {
        ok: false,
        code: "bad_request",
        message: "markdown must be ≤ 20,000 chars",
        field: "markdown",
      };
    }
  }

  const kind = o.kind as string;
  const patch = o.patch;

  if (patch !== undefined) {
    if (kind !== "code.apply" && kind !== "code.diff") {
      return {
        ok: false,
        code: "bad_request",
        message: "patch is only allowed when kind is code.apply or code.diff",
        field: "patch",
      };
    }

    if (typeof patch !== "string") {
      return {
        ok: false,
        code: "bad_request",
        message: "patch must be a string",
        field: "patch",
      };
    }

    const patchBytes = Buffer.byteLength(patch, "utf8");
    if (patchBytes > 1_000_000) {
      return {
        ok: false,
        code: "payload_too_large",
        message: "patch must be ≤ 1,000,000 bytes",
        field: "patch",
      };
    }

    if (patch.includes("\0")) {
      return {
        ok: false,
        code: "bad_request",
        message: "patch must not contain binary data (null bytes)",
        field: "patch",
      };
    }

    for (const marker of BINARY_PATCH_MARKERS) {
      if (patch.includes(marker)) {
        return {
          ok: false,
          code: "bad_request",
          message: "patch must not contain binary markers",
          field: "patch",
        };
      }
    }

    const hasDiffGit = VALID_PATCH_MARKERS.some((m) => patch.includes(m));
    const hasUnified =
      patch.includes(VALID_PATCH_ALTERNATIVE.prefix) &&
      patch.includes(VALID_PATCH_ALTERNATIVE.suffix);
    if (!hasDiffGit && !hasUnified) {
      return {
        ok: false,
        code: "bad_request",
        message:
          "patch must contain 'diff --git' or '--- ' and '+++ '",
        field: "patch",
      };
    }
  }

  if (kind === "code.apply" || kind === "code.diff") {
    const payload = o.payload;
    const codePayload =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).code
        : undefined;
    const diffText =
      codePayload && typeof codePayload === "object"
        ? (codePayload as Record<string, unknown>).diffText
        : undefined;
    const patchStr =
      (typeof patch === "string" ? patch : "").trim() ||
      (typeof diffText === "string" ? diffText : "").trim();

    if (!patchStr) {
      return {
        ok: false,
        code: "bad_request",
        message:
          "code.apply/code.diff requires patch (top-level) or payload.code.diffText",
        field: "patch",
      };
    }
  }

  if (kind === "send_email") {
    const parsed = parseSendEmailPayload(o.payload);
    if (!parsed.ok) {
      return {
        ok: false,
        code: "bad_request",
        message: parsed.message,
        field: parsed.field,
      };
    }
  }

  if (kind === "system.note") {
    const payload = o.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return {
        ok: false,
        code: "bad_request",
        message: "system.note requires payload (object)",
        field: "payload",
      };
    }
    const note = (payload as Record<string, unknown>).note;
    if (typeof note !== "string" || !note.trim()) {
      return {
        ok: false,
        code: "bad_request",
        message: "system.note requires payload.note (non-empty string)",
        field: "payload.note",
      };
    }
    if (note.length > SYSTEM_NOTE_MAX_LEN) {
      return {
        ok: false,
        code: "bad_request",
        message: `payload.note must be ≤ ${SYSTEM_NOTE_MAX_LEN} chars`,
        field: "payload.note",
      };
    }
  }

  if (o.confidence !== undefined) {
    const c = o.confidence;
    if (typeof c !== "number" || c < 0 || c > 1) {
      return {
        ok: false,
        code: "bad_request",
        message: "confidence must be a number 0–1",
        field: "confidence",
      };
    }
  }

  if (
    kind.startsWith("recovery.") &&
    allowedKinds.includes(kind)
  ) {
    const payload =
      o.payload && typeof o.payload === "object"
        ? (o.payload as Record<string, unknown>)
        : {};
    const required = [
      "symptom",
      "suspectedCause",
      "recoveryAction",
      "verificationCheck",
      "fallbackIfFailed",
    ] as const;
    for (const field of required) {
      const v = payload[field];
      if (typeof v !== "string" || v.trim().length === 0) {
        return {
          ok: false,
          code: "bad_request",
          message: `recovery kind requires payload.${field} (non-empty string)`,
          field: `payload.${field}`,
        };
      }
    }
  }

  return { ok: true };
}
