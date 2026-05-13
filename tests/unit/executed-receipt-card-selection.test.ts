import { describe, expect, it } from "vitest";
import { pickExecutedReceiptCardEvent, proposalTraceKey } from "@/lib/executed-receipt-card-selection";
import type { ProposalLifecycleEvent } from "@/lib/proposal-lifecycle";

function ev(
  partial: Partial<ProposalLifecycleEvent> & { id: string; traceId?: string }
): ProposalLifecycleEvent {
  return {
    createdAt: "2026-05-12T00:00:00.000Z",
    ...partial,
  } as ProposalLifecycleEvent;
}

describe("proposalTraceKey", () => {
  it("uses traceId when set", () => {
    expect(proposalTraceKey(ev({ id: "a", traceId: " tr-1 " }))).toBe("tr-1");
  });
  it("falls back to id", () => {
    expect(proposalTraceKey(ev({ id: "b" }))).toBe("b");
  });
});

describe("pickExecutedReceiptCardEvent", () => {
  const older = ev({
    id: "old",
    traceId: "trace-old",
    executed: true,
    executedAt: "2026-05-12T01:00:00.000Z",
  });
  const newer = ev({
    id: "new",
    traceId: "trace-new",
    executed: true,
    executedAt: "2026-05-12T02:00:00.000Z",
  });
  const pending = ev({
    id: "pend",
    traceId: "trace-pend",
    status: "pending",
    executed: false,
  });

  it("returns last executed when no URL trace", () => {
    const r = pickExecutedReceiptCardEvent([older, newer], null, newer);
    expect(r.card?.id).toBe("new");
    expect(r.traceUrlFallback).toBe(false);
  });

  it("honors URL trace over recency when that row is executed", () => {
    const r = pickExecutedReceiptCardEvent([older, newer], "trace-old", newer);
    expect(r.card?.id).toBe("old");
    expect(r.traceUrlFallback).toBe(false);
  });

  it("is case-insensitive on trace id", () => {
    const r = pickExecutedReceiptCardEvent([older, newer], "TRACE-OLD", newer);
    expect(r.card?.id).toBe("old");
    expect(r.traceUrlFallback).toBe(false);
  });

  it("falls back with flag when trace not in executed set", () => {
    const r = pickExecutedReceiptCardEvent([older, newer], "unknown-trace", newer);
    expect(r.card?.id).toBe("new");
    expect(r.traceUrlFallback).toBe(true);
  });

  it("ignores pending row with matching trace", () => {
    const r = pickExecutedReceiptCardEvent([pending, newer], "trace-pend", newer);
    expect(r.card?.id).toBe("new");
    expect(r.traceUrlFallback).toBe(true);
  });

  it("returns null card when nothing executed", () => {
    const r = pickExecutedReceiptCardEvent([pending], "x", null);
    expect(r.card).toBeNull();
    expect(r.traceUrlFallback).toBe(false);
  });
});
