/**
 * Strict schema validation for OpenClaw ingress payloads.
 * Enforces allowlisted keys, size limits, and kind-specific rules.
 */

export type ValidationError = {
  code: string;
  message: string;
  field?: string;
};

const RAW_BODY_MAX_BYTES = 1024 * 1024; // 1 MB
const TITLE_MAX_CHARS = 120;
const SUMMARY_MAX_CHARS = 2000;
const PATCH_MAX_BYTES = 1024 * 1024; // 1 MB

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
]);

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

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, body: o };
}
