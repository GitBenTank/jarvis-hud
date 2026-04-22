import { describe, it, expect } from "vitest";
import {
  groupEventsByProposalBatch,
  parseProposalBatchItemContext,
  proposalBatchActivitySuffix,
  strictValidateIngressBatch,
} from "@/lib/proposal-batch";

describe("parseProposalBatchItemContext", () => {
  it("accepts minimal valid batch", () => {
    expect(
      parseProposalBatchItemContext({
        id: "b1",
        itemIndex: 0,
        itemCount: 2,
      })
    ).toEqual({ id: "b1", itemIndex: 0, itemCount: 2 });
  });

  it("trims id title summary", () => {
    expect(
      parseProposalBatchItemContext({
        id: "  x  ",
        title: "  T  ",
        summary: "  S  ",
        itemIndex: 1,
        itemCount: 3,
      })
    ).toEqual({ id: "x", title: "T", summary: "S", itemIndex: 1, itemCount: 3 });
  });

  it("rejects itemIndex out of range", () => {
    expect(
      parseProposalBatchItemContext({ id: "b", itemIndex: 2, itemCount: 2 })
    ).toBeNull();
  });

  it("rejects missing id", () => {
    expect(parseProposalBatchItemContext({ itemIndex: 0, itemCount: 1 })).toBeNull();
  });
});

describe("proposalBatchActivitySuffix", () => {
  it("returns empty when no batch", () => {
    expect(proposalBatchActivitySuffix(undefined)).toBe("");
  });

  it("includes index and optional title", () => {
    expect(
      proposalBatchActivitySuffix({
        id: "b",
        title: "Daily",
        itemIndex: 1,
        itemCount: 4,
      })
    ).toBe(" · Batch 2/4: Daily");
  });
});

describe("strictValidateIngressBatch", () => {
  it("accepts valid batch and normalizes strings", () => {
    const r = strictValidateIngressBatch({
      id: "  b1 ",
      title: " T ",
      summary: " S ",
      itemIndex: 0,
      itemCount: 3,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.batch).toEqual({
        id: "b1",
        title: "T",
        summary: "S",
        itemIndex: 0,
        itemCount: 3,
      });
    }
  });

  it("rejects unknown key", () => {
    const r = strictValidateIngressBatch({
      id: "b",
      itemIndex: 0,
      itemCount: 1,
      rogue: 1,
    } as Record<string, unknown>);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("batch.rogue");
  });

  it("rejects itemCount over cap", () => {
    const r = strictValidateIngressBatch({
      id: "b",
      itemIndex: 0,
      itemCount: 101,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("batch.itemCount");
  });

  it("rejects non-integer itemIndex", () => {
    const r = strictValidateIngressBatch({
      id: "b",
      itemIndex: 0.5,
      itemCount: 2,
    });
    expect(r.ok).toBe(false);
  });
});

describe("groupEventsByProposalBatch", () => {
  it("partitions standalone and groups by batch id", () => {
    const events = [
      {
        id: "a",
        createdAt: "2026-04-22T10:00:00Z",
        batch: { id: "b1", itemIndex: 1, itemCount: 2 },
      },
      { id: "solo", createdAt: "2026-04-22T09:00:00Z" },
      {
        id: "b",
        createdAt: "2026-04-22T10:01:00Z",
        batch: { id: "b1", title: "T", itemIndex: 0, itemCount: 2 },
      },
    ];
    const { groups, standalone } = groupEventsByProposalBatch(events);
    expect(standalone.map((e) => e.id)).toEqual(["solo"]);
    expect(groups).toHaveLength(1);
    expect(groups[0].batchId).toBe("b1");
    expect(groups[0].title).toBe("T");
    expect(groups[0].items.map((e) => e.id)).toEqual(["b", "a"]);
  });
});
