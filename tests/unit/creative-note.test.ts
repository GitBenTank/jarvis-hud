import { describe, expect, it } from "vitest";

import { validateCreativeSystemNoteMarkdown } from "@/lib/creative-note";

describe("validateCreativeSystemNoteMarkdown", () => {
  it("accepts a valid creative note with 3 variant headings", () => {
    const result = validateCreativeSystemNoteMarkdown([
      "## Brief",
      "Hero copy rehearsal.",
      "",
      "## Audience",
      "Operators.",
      "",
      "## Angle",
      "Governance-first confidence.",
      "",
      "## Variants",
      "### Variant 1",
      "Option one.",
      "",
      "### Variant 2",
      "Option two.",
      "",
      "### Variant 3",
      "Option three.",
      "",
      "## Risks / notes",
      "None.",
      "",
      "## Sources",
      "- https://example.com/source",
    ].join("\n"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.variantCount).toBe(3);
      expect(result.sections.Brief).toContain("Hero copy rehearsal");
    }
  });

  it("accepts a numbered list in Variants", () => {
    const result = validateCreativeSystemNoteMarkdown([
      "## Brief",
      "Hero copy rehearsal.",
      "",
      "## Audience",
      "Operators.",
      "",
      "## Angle",
      "Governance-first confidence.",
      "",
      "## Variants",
      "1. Option one",
      "2. Option two",
      "3. Option three",
      "",
      "## Risks / notes",
      "None.",
      "",
      "## Sources",
      "- https://example.com/source",
    ].join("\n"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.variantCount).toBe(3);
    }
  });

  it("rejects a missing required section", () => {
    const result = validateCreativeSystemNoteMarkdown([
      "## Brief",
      "Hero copy rehearsal.",
      "",
      "## Audience",
      "Operators.",
      "",
      "## Angle",
      "Governance-first confidence.",
      "",
      "## Variants",
      "### Variant 1",
      "Option one.",
      "",
      "### Variant 2",
      "Option two.",
      "",
      "### Variant 3",
      "Option three.",
      "",
      "## Sources",
      "- https://example.com/source",
    ].join("\n"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Risks / notes");
      expect(result.fix).toContain("## Risks / notes");
    }
  });

  it("rejects fewer than 3 variants", () => {
    const result = validateCreativeSystemNoteMarkdown([
      "## Brief",
      "Hero copy rehearsal.",
      "",
      "## Audience",
      "Operators.",
      "",
      "## Angle",
      "Governance-first confidence.",
      "",
      "## Variants",
      "### Variant 1",
      "Option one.",
      "",
      "### Variant 2",
      "Option two.",
      "",
      "## Risks / notes",
      "None.",
      "",
      "## Sources",
      "- https://example.com/source",
    ].join("\n"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("3–5 distinct variants");
      expect(result.fix).toContain("Under ## Variants");
    }
  });
});
