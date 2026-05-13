import { NextResponse } from "next/server";

/**
 * Local / demo proposal entrypoints — **not** signed OpenClaw ingress.
 * See `docs/security/trusted-ingress.md` and README "Trusted vs helper" note.
 *
 * When **`JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS`** is `false` / `0` / `no` (case-insensitive),
 * `POST /api/events` and `POST /api/drafts/content` return **403** so strict deployments can rely on
 * `POST /api/ingress/openclaw` only. When unset, defaults to **enabled** (preserves local/script behavior).
 */
export function areEventsAndDraftsProposalApisEnabled(): boolean {
  const raw = process.env.JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true;
}

/** When local proposal APIs are disabled, return a 403 JSON body for POST handlers. */
export function localProposalApisDisabledResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Local proposal APIs are disabled",
      code: "local_proposal_apis_disabled",
      detail:
        "POST /api/events and POST /api/drafts/content are off (JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS=false). Use signed POST /api/ingress/openclaw, or set JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS=true for local development.",
    },
    { status: 403 }
  );
}
