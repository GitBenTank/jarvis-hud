/** Custom event: focus Activity proof panel and switch tab (graph | timeline). */
export const ACTIVITY_PROOF_TAB_EVENT = "jarvis-activity-proof-tab" as const;

export type ActivityProofTab = "graph" | "timeline";

export type ActivityProofTabEventDetail = { tab: ActivityProofTab };
