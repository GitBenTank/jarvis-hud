import { describe, expect, it } from "vitest";
import {
  ACTOR_LOCAL_USER,
  ACTOR_OPENCLAW,
  agentActorFromAgentField,
  buildReceiptActorsFromEvent,
} from "@/lib/actor-identity";

describe("actor-identity", () => {
  it("buildReceiptActorsFromEvent includes proposer, approver, executor", () => {
    const actors = buildReceiptActorsFromEvent({
      actorId: ACTOR_OPENCLAW.actorId,
      actorType: ACTOR_OPENCLAW.actorType,
      actorLabel: ACTOR_OPENCLAW.actorLabel,
      approvalActorId: ACTOR_LOCAL_USER.actorId,
      approvalActorType: ACTOR_LOCAL_USER.actorType,
      approvalActorLabel: ACTOR_LOCAL_USER.actorLabel,
      executionActorId: ACTOR_LOCAL_USER.actorId,
      executionActorType: ACTOR_LOCAL_USER.actorType,
      executionActorLabel: ACTOR_LOCAL_USER.actorLabel,
    });
    expect(actors.proposer.actorId).toBe("openclaw");
    expect(actors.approver?.actorId).toBe("local-user");
    expect(actors.executor?.actorId).toBe("local-user");
  });

  it("falls back proposer from agent string when actorId missing", () => {
    const actors = buildReceiptActorsFromEvent({ agent: "ben-local" });
    expect(actors.proposer.actorId).toBe("ben-local");
    expect(actors.proposer.actorType).toBe("agent");
  });

  it("agentActorFromAgentField slugifies display name", () => {
    const a = agentActorFromAgentField("My Agent!");
    expect(a.actorType).toBe("agent");
    expect(a.actorId.length).toBeGreaterThan(0);
  });
});
