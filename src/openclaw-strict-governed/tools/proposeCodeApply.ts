import { submitOpenClawIngress } from "../jarvisClient";

export type ProposeCodeApplyInput = {
  title: string;
  summary: string;
  diffText: string;
  agent: string;
  sourceAgentId: string;
};

export type ProposeCodeApplyOk = {
  ok: true;
  proposalId: string;
  traceId: string;
  message: string;
};

export type ProposeCodeApplyErr = {
  ok: false;
  message: string;
  status: number;
  rawBody?: string;
};

export type ProposeCodeApplyResult = ProposeCodeApplyOk | ProposeCodeApplyErr;

function buildCodeApplyBody(input: ProposeCodeApplyInput): Record<string, unknown> {
  const title = input.title.trim();
  const summary = input.summary.trim();
  const agent = input.agent.trim();
  const sourceAgentId = input.sourceAgentId.trim();
  const patch = input.diffText.trim();

  if (!title) throw new Error("proposeCodeApply: title is required");
  if (!summary) throw new Error("proposeCodeApply: summary is required");
  if (!patch) throw new Error("proposeCodeApply: diffText is required");
  if (!agent) throw new Error("proposeCodeApply: agent is required");
  if (!sourceAgentId) throw new Error("proposeCodeApply: sourceAgentId is required");

  return {
    kind: "code.apply",
    title,
    summary,
    patch,
    agent,
    source: {
      connector: "openclaw",
      agentId: sourceAgentId,
    },
  };
}

/**
 * Submits a code.apply proposal to Jarvis ingress only — does not mutate the local repo.
 * Does not claim execution; operator must Approve + Execute in the HUD.
 */
export async function proposeCodeApply(
  input: ProposeCodeApplyInput
): Promise<ProposeCodeApplyResult> {
  const body = buildCodeApplyBody(input);
  const res = await submitOpenClawIngress(body);

  if (res.ok) {
    return {
      ok: true,
      proposalId: res.id,
      traceId: res.traceId,
      message: "Proposal submitted to Jarvis.",
    };
  }

  return {
    ok: false,
    message: res.error,
    status: res.status,
    rawBody: res.rawBody,
  };
}
