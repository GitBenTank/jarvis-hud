import { afterEach, describe, expect, it } from "vitest";
import {
  areEventsAndDraftsProposalApisEnabled,
  localProposalApisDisabledResponse,
} from "@/lib/local-proposal-apis";

const KEY = "JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS";

describe("local-proposal-apis", () => {
  afterEach(() => {
    delete process.env[KEY];
  });

  it("treats unset as enabled", () => {
    expect(areEventsAndDraftsProposalApisEnabled()).toBe(true);
  });

  it("treats false, 0, no as disabled", () => {
    for (const v of ["false", "FALSE", "0", "no"]) {
      process.env[KEY] = v;
      expect(areEventsAndDraftsProposalApisEnabled()).toBe(false);
    }
  });

  it("treats true as enabled", () => {
    process.env[KEY] = "true";
    expect(areEventsAndDraftsProposalApisEnabled()).toBe(true);
  });

  it("disabled response is 403 with stable code", async () => {
    const res = localProposalApisDisabledResponse();
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("local_proposal_apis_disabled");
  });
});
