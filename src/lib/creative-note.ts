const REQUIRED_CREATIVE_NOTE_SECTIONS = [
  "Brief",
  "Audience",
  "Angle",
  "Variants",
  "Risks / notes",
  "Sources",
] as const;

export type CreativeNoteSectionName = (typeof REQUIRED_CREATIVE_NOTE_SECTIONS)[number];

export type CreativeNoteValidationResult =
  | {
      ok: true;
      sections: Record<CreativeNoteSectionName, string>;
      variantCount: number;
    }
  | {
      ok: false;
      message: string;
      field: string;
      fix: string;
    };

export function validateCreativeSystemNoteMarkdown(
  markdown: unknown
): CreativeNoteValidationResult {
  if (typeof markdown !== "string") {
    return {
      ok: false,
      message: "creative note markdown must be a string",
      field: "payload.note",
      fix: "Provide payload.note as markdown text with the required Phase 5 headings.",
    };
  }

  const text = markdown.trim();
  if (!text) {
    return {
      ok: false,
      message: "creative note markdown must be non-empty",
      field: "payload.note",
      fix: "Add a creative memo body with ## Brief, ## Audience, ## Angle, ## Variants, ## Risks / notes, and ## Sources.",
    };
  }

  const sections = extractRequiredSections(text);
  if (!sections.ok) return sections;

  const variantsBody = sections.sections["Variants"];
  const variantCount = countVariants(variantsBody);
  if (variantCount < 3 || variantCount > 5) {
    return {
      ok: false,
      message:
        "creative note Variants section must contain 3–5 distinct variants (use ### Variant headings or a numbered list)",
      field: "payload.note",
      fix: "Under ## Variants, add 3–5 items using either ### Variant 1… headings or a numbered list.",
    };
  }

  return { ok: true, sections: sections.sections, variantCount };
}

function extractRequiredSections(
  markdown: string
):
  | { ok: true; sections: Record<CreativeNoteSectionName, string> }
  | { ok: false; message: string; field: string; fix: string } {
  const headingMatches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  const sectionMap = new Map<string, string>();

  for (let i = 0; i < headingMatches.length; i++) {
    const current = headingMatches[i];
    const next = headingMatches[i + 1];
    const rawName = current[1]?.trim() ?? "";
    const start = current.index! + current[0].length;
    const end = next?.index ?? markdown.length;
    const body = markdown.slice(start, end).trim();
    sectionMap.set(rawName, body);
  }

  const sections = {} as Record<CreativeNoteSectionName, string>;
  for (const name of REQUIRED_CREATIVE_NOTE_SECTIONS) {
    const body = sectionMap.get(name)?.trim() ?? "";
    if (!body) {
      return {
        ok: false,
        message: `creative note requires non-empty section: ## ${name}`,
        field: "payload.note",
        fix: `Add content under ## ${name}.`,
      };
    }
    sections[name] = body;
  }

  return { ok: true, sections };
}

function countVariants(variantsBody: string): number {
  const headingCount = [...variantsBody.matchAll(/^###\s+Variant\b.*$/gim)].length;
  if (headingCount > 0) return headingCount;

  const numberedItems = [...variantsBody.matchAll(/^\s*\d+\.\s+.+$/gm)].length;
  return numberedItems;
}

export const CREATIVE_NOTE_REQUIRED_SECTIONS = REQUIRED_CREATIVE_NOTE_SECTIONS;
