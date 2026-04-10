/**
 * Normalize ad-hoc or nested OpenClaw-style JSON into a flat Jarvis OpenClaw ingress body.
 * Does not sign or send — use submitProposal for transport.
 *
 * Aligned with allowlist in `src/lib/ingress/validate-openclaw-proposal.ts`.
 */

const META_DEFAULTS = {
  agent: "alfred",
  builder: "forge",
  provider: "openai",
  model: "openai/gpt-4o",
} as const;

const ALLOWED_TOP_LEVEL = new Set([
  "kind",
  "title",
  "summary",
  "markdown",
  "payload",
  "patch",
  "source",
  "confidence",
  "correlationId",
  "agent",
  "builder",
  "provider",
  "model",
]);

export type NormalizeOk = { ok: true; body: Record<string, unknown> };
export type NormalizeErr = { ok: false; error: string; field?: string };
export type NormalizeResult = NormalizeOk | NormalizeErr;

export function normalizeProposal(input: unknown): NormalizeResult {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Input must be a JSON object", field: "input" };
  }

  const raw = input as Record<string, unknown>;
  const { proposal: nested, ...rest } = raw;

  let o: Record<string, unknown> = { ...rest };
  if (nested != null && typeof nested === "object" && !Array.isArray(nested)) {
    o = { ...o, ...(nested as Record<string, unknown>) };
  }

  delete o.proposal;

  o.agent =
    typeof o.agent === "string" && o.agent.trim() ? o.agent.trim() : META_DEFAULTS.agent;
  o.builder =
    typeof o.builder === "string" && o.builder.trim() ? o.builder.trim() : META_DEFAULTS.builder;
  o.provider =
    typeof o.provider === "string" && o.provider.trim()
      ? o.provider.trim()
      : META_DEFAULTS.provider;
  o.model =
    typeof o.model === "string" && o.model.trim() ? o.model.trim() : META_DEFAULTS.model;

  const src =
    o.source != null && typeof o.source === "object" && !Array.isArray(o.source)
      ? (o.source as Record<string, unknown>)
      : {};
  o.source = { ...src, connector: "openclaw" };

  if (typeof o.kind !== "string" || !o.kind.trim()) {
    return { ok: false, error: "kind is required (non-empty string)", field: "kind" };
  }
  o.kind = o.kind.trim();

  if (typeof o.content === "string" && o.content.trim()) {
    const note = o.content.trim();
    if (o.payload == null || typeof o.payload !== "object" || Array.isArray(o.payload)) {
      o.payload = { note };
    } else {
      const p = o.payload as Record<string, unknown>;
      if (p.note == null || (typeof p.note === "string" && !p.note.trim())) {
        p.note = note;
      }
    }
    delete o.content;
  }

  if (typeof o.title !== "string" || !o.title.trim()) {
    const p =
      o.payload && typeof o.payload === "object" && !Array.isArray(o.payload)
        ? (o.payload as Record<string, unknown>)
        : {};
    const note = typeof p.note === "string" ? p.note.trim() : "";
    o.title = note ? note.slice(0, 120) : "(untitled)";
  } else {
    o.title = (o.title as string).trim();
  }

  if (typeof o.summary !== "string" || !o.summary.trim()) {
    const p =
      o.payload && typeof o.payload === "object" && !Array.isArray(o.payload)
        ? (o.payload as Record<string, unknown>)
        : {};
    const note = typeof p.note === "string" ? p.note.trim() : "";
    o.summary = note ? note.slice(0, 500) : String(o.title);
  } else {
    o.summary = (o.summary as string).trim();
  }

  if (o.payload == null || typeof o.payload !== "object" || Array.isArray(o.payload)) {
    return { ok: false, error: "payload is required (object)", field: "payload" };
  }

  const body: Record<string, unknown> = {};
  for (const key of ALLOWED_TOP_LEVEL) {
    if (Object.prototype.hasOwnProperty.call(o, key) && o[key] !== undefined) {
      body[key] = o[key];
    }
  }

  return { ok: true, body };
}
