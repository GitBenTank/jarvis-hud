/**
 * Strict schema validation for OpenClaw ingress payloads.
 * Enforces allowlisted keys, size limits, and kind-specific rules.
 */

import { SEND_EMAIL_DEMO_ALLOWED_TO } from "./send-email-constants";

export type ValidationError = {
  code: string;
  message: string;
  field?: string;
};

const RAW_BODY_MAX_BYTES = 1024 * 1024; // 1 MB
const TITLE_MAX_CHARS = 120;
const SUMMARY_MAX_CHARS = 2000;
const PATCH_MAX_BYTES = 1024 * 1024; // 1 MB
const SYSTEM_NOTE_PAYLOAD_MAX_CHARS = 50_000;
const SEND_EMAIL_SUBJECT_MAX = 200;
const SEND_EMAIL_BODY_MAX = 50_000;

const ALLOWLISTED_TOP_LEVEL_KEYS = new Set([
  "kind",
  "title",
  "summary",
  "source",
  "payload",
  "patch",
  "markdown",
  "confidence",
  "correlationId",
  "agent",
  "builder",
  "provider",
  "model",
  "batch",
]);

const AGENT_METADATA_MAX_LEN = 64;
const MODEL_METADATA_MAX_LEN = 128;

export function validateRawBodySize(rawBody: string): ValidationError | null {
  const bytes = Buffer.byteLength(rawBody, "utf8");
  if (bytes > RAW_BODY_MAX_BYTES) {
    return {
      code: "BODY_TOO_LARGE",
      message: `Request body exceeds ${RAW_BODY_MAX_BYTES} bytes`,
      field: "body",
    };
  }
  return null;
}

export function validateIngressBody(
  body: unknown
): { ok: true; body: Record<string, unknown> } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    return {
      ok: false,
      errors: [{ code: "INVALID_BODY", message: "Body must be a JSON object", field: "body" }],
    };
  }

  const o = body as Record<string, unknown>;

  for (const key of Object.keys(o)) {
    if (!ALLOWLISTED_TOP_LEVEL_KEYS.has(key)) {
      errors.push({
        code: "UNKNOWN_FIELD",
        message: `Unknown field: ${key}`,
        field: key,
      });
    }
  }

  if (typeof o.kind !== "string") {
    errors.push({ code: "MISSING_FIELD", message: "kind is required", field: "kind" });
  }
  if (typeof o.title !== "string") {
    errors.push({ code: "MISSING_FIELD", message: "title is required", field: "title" });
  }
  if (typeof o.summary !== "string") {
    errors.push({ code: "MISSING_FIELD", message: "summary is required", field: "summary" });
  }

  const source = o.source;
  if (!source || typeof source !== "object") {
    errors.push({
      code: "MISSING_FIELD",
      message: "source is required",
      field: "source",
    });
  } else {
    const srcObj = source as Record<string, unknown>;
    if (srcObj.connector !== "openclaw") {
      errors.push({
        code: "INVALID_SOURCE",
        message: "source.connector must be 'openclaw'",
        field: "source.connector",
      });
    }
  }

  if (o.agent !== undefined) {
    if (typeof o.agent !== "string") {
      errors.push({
        code: "INVALID_FIELD",
        message: "agent must be a string when provided",
        field: "agent",
      });
    } else if (o.agent.length > AGENT_METADATA_MAX_LEN) {
      errors.push({
        code: "FIELD_TOO_LONG",
        message: `agent must be ≤ ${AGENT_METADATA_MAX_LEN} chars`,
        field: "agent",
      });
    }
  }

  if (o.builder !== undefined) {
    if (typeof o.builder !== "string") {
      errors.push({
        code: "INVALID_FIELD",
        message: "builder must be a string when provided",
        field: "builder",
      });
    } else if (o.builder.length > AGENT_METADATA_MAX_LEN) {
      errors.push({
        code: "FIELD_TOO_LONG",
        message: `builder must be ≤ ${AGENT_METADATA_MAX_LEN} chars`,
        field: "builder",
      });
    }
  }

  if (o.provider !== undefined) {
    if (typeof o.provider !== "string") {
      errors.push({
        code: "INVALID_FIELD",
        message: "provider must be a string when provided",
        field: "provider",
      });
    } else if (o.provider.length > AGENT_METADATA_MAX_LEN) {
      errors.push({
        code: "FIELD_TOO_LONG",
        message: `provider must be ≤ ${AGENT_METADATA_MAX_LEN} chars`,
        field: "provider",
      });
    }
  }

  if (o.model !== undefined) {
    if (typeof o.model !== "string") {
      errors.push({
        code: "INVALID_FIELD",
        message: "model must be a string when provided",
        field: "model",
      });
    } else if (o.model.length > MODEL_METADATA_MAX_LEN) {
      errors.push({
        code: "FIELD_TOO_LONG",
        message: `model must be ≤ ${MODEL_METADATA_MAX_LEN} chars`,
        field: "model",
      });
    }
  }

  if (o.batch !== undefined) {
    if (o.batch === null || typeof o.batch !== "object" || Array.isArray(o.batch)) {
      errors.push({
        code: "INVALID_FIELD",
        message: "batch must be a plain object when provided",
        field: "batch",
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const kind = o.kind as string;
  const title = o.title as string;
  const summary = o.summary as string;
  const patch = o.patch;

  if (title.length > TITLE_MAX_CHARS) {
    errors.push({
      code: "FIELD_TOO_LONG",
      message: `title must be ≤ ${TITLE_MAX_CHARS} chars`,
      field: "title",
    });
  }

  if (summary.length > SUMMARY_MAX_CHARS) {
    errors.push({
      code: "FIELD_TOO_LONG",
      message: `summary must be ≤ ${SUMMARY_MAX_CHARS} chars`,
      field: "summary",
    });
  }

  if (patch !== undefined && kind !== "code.apply") {
    errors.push({
      code: "PATCH_NOT_ALLOWED",
      message: "patch is only allowed when kind is code.apply",
      field: "patch",
    });
  }

  if (kind === "code.apply") {
    const payload = o.payload;
    const codePayload =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).code
        : undefined;
    const diffTextFromPayload =
      codePayload && typeof codePayload === "object"
        ? (codePayload as Record<string, unknown>).diffText
        : undefined;
    const patchStr =
      (typeof patch === "string" ? patch : "").trim() ||
      (typeof diffTextFromPayload === "string" ? diffTextFromPayload : "").trim();

    if (!patchStr) {
      errors.push({
        code: "PATCH_REQUIRED",
        message: "code.apply requires patch (top-level) or payload.code.diffText",
        field: "patch",
      });
    } else {
      const patchBytes = Buffer.byteLength(patchStr, "utf8");
      if (patchBytes > PATCH_MAX_BYTES) {
        errors.push({
          code: "PATCH_TOO_LARGE",
          message: `patch must be ≤ ${PATCH_MAX_BYTES} bytes`,
          field: "patch",
        });
      }
      if (patchStr.includes("\0")) {
        errors.push({
          code: "PATCH_BINARY",
          message: "patch must not contain binary data (null bytes)",
          field: "patch",
        });
      }
    }
  }

  if (kind === "system.note" && patch !== undefined) {
    errors.push({
      code: "PATCH_NOT_ALLOWED",
      message: "system.note must not include patch",
      field: "patch",
    });
  }

  if (kind === "send_email" && patch !== undefined) {
    errors.push({
      code: "PATCH_NOT_ALLOWED",
      message: "send_email must not include patch",
      field: "patch",
    });
  }

  if (kind === "system.note") {
    const payload = o.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      errors.push({
        code: "MISSING_FIELD",
        message: "system.note requires payload (object)",
        field: "payload",
      });
    } else {
      const note = (payload as Record<string, unknown>).note;
      if (typeof note !== "string" || !note.trim()) {
        errors.push({
          code: "MISSING_FIELD",
          message: "system.note requires payload.note (non-empty string)",
          field: "payload.note",
        });
      } else if (note.length > SYSTEM_NOTE_PAYLOAD_MAX_CHARS) {
        errors.push({
          code: "FIELD_TOO_LONG",
          message: `payload.note must be ≤ ${SYSTEM_NOTE_PAYLOAD_MAX_CHARS} chars`,
          field: "payload.note",
        });
      }
    }
  }

  if (kind === "send_email") {
    const payload = o.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      errors.push({
        code: "MISSING_FIELD",
        message: "send_email requires payload (object)",
        field: "payload",
      });
    } else {
      const pl = payload as Record<string, unknown>;
      const to = typeof pl.to === "string" ? pl.to.trim() : "";
      const subject = typeof pl.subject === "string" ? pl.subject.trim() : "";
      const body = typeof pl.body === "string" ? pl.body : "";
      if (!to) {
        errors.push({
          code: "MISSING_FIELD",
          message: "send_email requires payload.to",
          field: "payload.to",
        });
      } else if (to !== SEND_EMAIL_DEMO_ALLOWED_TO) {
        errors.push({
          code: "INVALID_FIELD",
          message: `send_email demo: payload.to must be exactly ${SEND_EMAIL_DEMO_ALLOWED_TO}`,
          field: "payload.to",
        });
      }
      if (!subject) {
        errors.push({
          code: "MISSING_FIELD",
          message: "send_email requires payload.subject",
          field: "payload.subject",
        });
      } else if (subject.length > SEND_EMAIL_SUBJECT_MAX) {
        errors.push({
          code: "FIELD_TOO_LONG",
          message: `send_email payload.subject must be ≤ ${SEND_EMAIL_SUBJECT_MAX} chars`,
          field: "payload.subject",
        });
      }
      if (!body.trim()) {
        errors.push({
          code: "MISSING_FIELD",
          message: "send_email requires payload.body (non-empty string)",
          field: "payload.body",
        });
      } else if (body.length > SEND_EMAIL_BODY_MAX) {
        errors.push({
          code: "FIELD_TOO_LONG",
          message: `send_email payload.body must be ≤ ${SEND_EMAIL_BODY_MAX} chars`,
          field: "payload.body",
        });
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, body: o };
}
