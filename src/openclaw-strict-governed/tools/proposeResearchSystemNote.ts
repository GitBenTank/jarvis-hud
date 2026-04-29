import { submitOpenClawIngress } from "../jarvisClient";

/** Grep anchor aligned with `docs/architecture/flagship-proposal-shape-examples-v1.md` Flow 1 (Research digest). */
export const FLAGSHIP_FLOW_1_GREP_ANCHOR = "flagship-flow-1-eu-ai-act-digest";

/** Grep anchor for the Alfred intake `system.note` in the same bundle (distinct coordinator). */
export const FLAGSHIP_FLOW_1_ALFRED_INTAKE_GREP_ANCHOR = "flagship-flow-1-alfred-intake";

/**
 * Stable id to correlate Alfred intake + Research digest proposals in logs and the HUD
 * (optional in ingress; pair both sample JSON files with this value).
 */
export const FLAGSHIP_FLOW_1_BUNDLE_CORRELATION_ID = "flagship-bundle-eu-ai-act-001";

export type ProposeResearchSystemNoteInput = {
  title: string;
  summary: string;
  /** Full note body (`payload.note`); persisted only after Jarvis approve + execute. */
  note: string;
  /** Upstream OpenClaw / runtime identity (e.g. session or agent install id). */
  sourceAgentId: string;
  /**
   * Proposal owner metadata. Defaults to `research` per team contract (Research owns the evidence proposal).
   */
  agent?: string;
  builder?: string;
  provider?: string;
  model?: string;
  correlationId?: string;
  /** Optional rendered digest (≤ 20k chars); does not replace `payload.note`. */
  markdown?: string;
  /**
   * When true (default), prefixes `note` with `grep_anchor: …` if the anchor string is not already present.
   */
  includeGrepAnchor?: boolean;
  /** Override default [FLAGSHIP_FLOW_1_GREP_ANCHOR]. */
  grepAnchor?: string;
  sourceSessionId?: string;
};

export type ProposeResearchSystemNoteOk = {
  ok: true;
  proposalId: string;
  traceId: string;
  message: string;
};

export type ProposeResearchSystemNoteErr = {
  ok: false;
  message: string;
  status: number;
  rawBody?: string;
};

export type ProposeResearchSystemNoteResult =
  | ProposeResearchSystemNoteOk
  | ProposeResearchSystemNoteErr;

function validateCoreFields(
  title: string,
  summary: string,
  note: string,
  sourceAgentId: string,
  agent: string
): void {
  if (!title) throw new Error("system.note proposal: title is required");
  if (title.length > 120) {
    throw new Error("system.note proposal: title must be ≤ 120 chars");
  }
  if (!summary) throw new Error("system.note proposal: summary is required");
  if (summary.length > 500) {
    throw new Error("system.note proposal: summary must be ≤ 500 chars");
  }
  if (!note) throw new Error("system.note proposal: note is required");
  if (!sourceAgentId) {
    throw new Error("system.note proposal: sourceAgentId is required");
  }
  if (!agent) throw new Error("system.note proposal: agent is required");
}

function noteWithOptionalAnchor(
  note: string,
  includeAnchor: boolean,
  anchor: string
): string {
  if (!includeAnchor || !anchor || note.includes(anchor)) return note;
  return `grep_anchor: ${anchor}\n\n${note}`;
}

function attachOptionalIngressFields(
  body: Record<string, unknown>,
  input: ProposeResearchSystemNoteInput
): void {
  if (input.builder?.trim()) body.builder = input.builder.trim();
  if (input.provider?.trim()) body.provider = input.provider.trim();
  if (input.model?.trim()) body.model = input.model.trim();
  if (input.correlationId?.trim()) body.correlationId = input.correlationId.trim();

  const md = input.markdown?.trim();
  if (!md) return;
  if (md.length > 20_000) {
    throw new Error("system.note proposal: markdown must be ≤ 20,000 chars");
  }
  body.markdown = md;
}

function buildResearchSystemNoteBody(
  input: ProposeResearchSystemNoteInput
): Record<string, unknown> {
  const title = input.title.trim();
  const summary = input.summary.trim();
  const sourceAgentId = input.sourceAgentId.trim();
  const agent = (input.agent ?? "research").trim();
  let note = input.note.trim();

  validateCoreFields(title, summary, note, sourceAgentId, agent);

  const includeAnchor = input.includeGrepAnchor !== false;
  const anchor = (input.grepAnchor ?? FLAGSHIP_FLOW_1_GREP_ANCHOR).trim();
  note = noteWithOptionalAnchor(note, includeAnchor, anchor);

  const sessionId = input.sourceSessionId?.trim();
  const body: Record<string, unknown> = {
    kind: "system.note",
    title,
    summary,
    agent,
    payload: { note },
    source: {
      connector: "openclaw",
      agentId: sourceAgentId,
      ...(sessionId ? { sessionId } : {}),
    },
  };

  attachOptionalIngressFields(body, input);
  return body;
}

async function postSystemNoteIngress(
  body: Record<string, unknown>,
  okMessage: string
): Promise<ProposeResearchSystemNoteResult> {
  const res = await submitOpenClawIngress(body);

  if (res.ok) {
    return {
      ok: true,
      proposalId: res.id,
      traceId: res.traceId,
      message: okMessage,
    };
  }

  return {
    ok: false,
    message: res.error,
    status: res.status,
    rawBody: res.rawBody,
  };
}

/**
 * Submits a `system.note` proposal to Jarvis ingress only — does not persist notes locally.
 * Use after Alfred intake + Research evidence work; operator must Approve + Execute in the HUD.
 */
export async function proposeResearchSystemNote(
  input: ProposeResearchSystemNoteInput
): Promise<ProposeResearchSystemNoteResult> {
  const body = buildResearchSystemNoteBody(input);
  return postSystemNoteIngress(body, "Research system.note proposal submitted to Jarvis.");
}

/** Input for Alfred’s intake note (defaults: `agent: alfred`, Alfred grep anchor). */
export type ProposeAlfredIntakeSystemNoteInput = Omit<
  ProposeResearchSystemNoteInput,
  "agent" | "grepAnchor"
> & {
  agent?: string;
  grepAnchor?: string;
};

/**
 * Submits Alfred’s intake `system.note` (routing, consent summary) — same governed path as Research.
 * Run **before** `proposeResearchSystemNote` when demoing the full flagship bundle.
 */
export async function proposeAlfredIntakeSystemNote(
  input: ProposeAlfredIntakeSystemNoteInput
): Promise<ProposeResearchSystemNoteResult> {
  const merged: ProposeResearchSystemNoteInput = {
    ...input,
    agent: input.agent ?? "alfred",
    grepAnchor: input.grepAnchor ?? FLAGSHIP_FLOW_1_ALFRED_INTAKE_GREP_ANCHOR,
  };
  const body = buildResearchSystemNoteBody(merged);
  return postSystemNoteIngress(body, "Alfred intake system.note proposal submitted to Jarvis.");
}
