/**
 * workflow.plan (v0.3) — validated multi-step envelope; execute runs only allowlisted
 * safe kinds sequentially (system.note only for this slice).
 */

export const WORKFLOW_PLAN_MIN_STEPS = 2;
export const WORKFLOW_PLAN_MAX_STEPS = 6;
const STEP_TITLE_MAX = 120;
const STEP_SUMMARY_MAX = 2000;
const NOTE_MAX = 50_000;

const STEP_ALLOW_KEYS = new Set(["kind", "title", "summary", "payload"]);

export type WorkflowSystemNoteStep = {
  kind: "system.note";
  title: string;
  summary: string;
  note: string;
  tags?: string[];
};

export type WorkflowPlanParseResult =
  | { ok: true; steps: WorkflowSystemNoteStep[] }
  | { ok: false; message: string; field?: string };

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Validate `payload` from ingress `payload` object (shape: `{ steps: [...] }`).
 * Also works when `steps` is merged onto the stored proposal envelope.
 */
export function parseWorkflowPlanPayload(payload: unknown): WorkflowPlanParseResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      message: "workflow.plan requires payload (object) with steps",
      field: "payload",
    };
  }
  const p = payload as Record<string, unknown>;
  const stepsRaw = p.steps;
  if (!Array.isArray(stepsRaw)) {
    return { ok: false, message: "workflow.plan requires payload.steps (array)", field: "payload.steps" };
  }
  if (stepsRaw.length < WORKFLOW_PLAN_MIN_STEPS) {
    return {
      ok: false,
      message: `workflow.plan requires at least ${WORKFLOW_PLAN_MIN_STEPS} steps`,
      field: "payload.steps",
    };
  }
  if (stepsRaw.length > WORKFLOW_PLAN_MAX_STEPS) {
    return {
      ok: false,
      message: `workflow.plan allows at most ${WORKFLOW_PLAN_MAX_STEPS} steps`,
      field: "payload.steps",
    };
  }

  const steps: WorkflowSystemNoteStep[] = [];
  for (let i = 0; i < stepsRaw.length; i++) {
    const s = stepsRaw[i];
    const fieldPrefix = `payload.steps[${i}]`;
    if (!s || typeof s !== "object" || Array.isArray(s)) {
      return { ok: false, message: "each step must be an object", field: fieldPrefix };
    }
    const so = s as Record<string, unknown>;
    for (const k of Object.keys(so)) {
      if (!STEP_ALLOW_KEYS.has(k)) {
        return {
          ok: false,
          message: `unknown field on workflow step: ${k}`,
          field: `${fieldPrefix}.${k}`,
        };
      }
    }
    if (so.kind !== "system.note") {
      return {
        ok: false,
        message: `workflow.plan v0.3 only allows system.note steps (got "${String(so.kind)}")`,
        field: `${fieldPrefix}.kind`,
      };
    }
    if (typeof so.title !== "string" || !so.title.trim()) {
      return { ok: false, message: "step requires title (non-empty string)", field: `${fieldPrefix}.title` };
    }
    if (so.title.length > STEP_TITLE_MAX) {
      return {
        ok: false,
        message: `step title must be ≤ ${STEP_TITLE_MAX} chars`,
        field: `${fieldPrefix}.title`,
      };
    }
    if (typeof so.summary !== "string" || !so.summary.trim()) {
      return {
        ok: false,
        message: "step requires summary (non-empty string)",
        field: `${fieldPrefix}.summary`,
      };
    }
    if (so.summary.length > STEP_SUMMARY_MAX) {
      return {
        ok: false,
        message: `step summary must be ≤ ${STEP_SUMMARY_MAX} chars`,
        field: `${fieldPrefix}.summary`,
      };
    }
    const pl = so.payload;
    if (!pl || typeof pl !== "object" || Array.isArray(pl)) {
      return {
        ok: false,
        message: "system.note step requires payload (object)",
        field: `${fieldPrefix}.payload`,
      };
    }
    const note = (pl as Record<string, unknown>).note;
    if (!nonEmptyString(note)) {
      return {
        ok: false,
        message: "system.note step requires payload.note (non-empty string)",
        field: `${fieldPrefix}.payload.note`,
      };
    }
    if (note.length > NOTE_MAX) {
      return {
        ok: false,
        message: `payload.note must be ≤ ${NOTE_MAX} chars`,
        field: `${fieldPrefix}.payload.note`,
      };
    }
    const tagsRaw = (pl as Record<string, unknown>).tags;
    let tags: string[] | undefined;
    if (tagsRaw !== undefined) {
      if (!Array.isArray(tagsRaw)) {
        return {
          ok: false,
          message: "payload.tags must be an array when present",
          field: `${fieldPrefix}.payload.tags`,
        };
      }
      tags = tagsRaw.map(String);
    }
    steps.push({
      kind: "system.note",
      title: so.title.trim(),
      summary: so.summary.trim(),
      note: note.trim(),
      tags,
    });
  }

  return { ok: true, steps };
}

export function childApprovalIdForWorkflowStep(parentApprovalId: string, stepIndex: number): string {
  return `${parentApprovalId}__wf_${stepIndex}`;
}
