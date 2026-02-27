import { promises as fs } from "node:fs";
import path from "node:path";
import { ensurePathSafe, ensureDir, getReflectionDir } from "./storage";

export type ReflectionInput = {
  reflectionId: string;
  dateKey: string;
  sourceKind: string;
  sourceApprovalId: string;
  sourceOutputPath: string;
  createdAt: string;
};

const REFLECTION_TEMPLATE = `# Reflection

**Source:** {{sourceKind}}
**Approval ID:** {{sourceApprovalId}}
**Output path:** {{sourceOutputPath}}

---

## What worked

- 

## What to improve

- 

## Signals (fill in later)

- Audience reaction:
- Technical friction:
- Next iteration:
`;

export async function writeReflection(input: ReflectionInput): Promise<string> {
  const dir = getReflectionDir(input.dateKey, input.reflectionId);
  ensurePathSafe(dir);
  await ensureDir(dir);

  const manifest = {
    reflectionId: input.reflectionId,
    dateKey: input.dateKey,
    createdAt: input.createdAt,
    kind: "reflection.note",
    sourceKind: input.sourceKind,
    sourceApprovalId: input.sourceApprovalId,
    sourceOutputPath: input.sourceOutputPath,
  };

  const reflectionContent = REFLECTION_TEMPLATE
    .replace(/\{\{sourceKind\}\}/g, input.sourceKind)
    .replace(/\{\{sourceApprovalId\}\}/g, input.sourceApprovalId)
    .replace(/\{\{sourceOutputPath\}\}/g, input.sourceOutputPath);

  await fs.writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  await fs.writeFile(path.join(dir, "reflection.md"), reflectionContent, "utf-8");

  return dir;
}
