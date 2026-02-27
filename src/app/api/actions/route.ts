import { NextResponse } from "next/server";
import { readActionLog, getPublishArtifactPath } from "@/lib/action-log";
import { getDateKey } from "@/lib/storage";

export async function GET() {
  try {
    const dateKey = getDateKey();
    const actions = await readActionLog();
    const enriched = actions.map((a) => {
      const entry = { ...a };
      if (!entry.outputPath && a.kind === "content.publish" && a.approvalId) {
        (entry as { outputPath?: string }).outputPath = getPublishArtifactPath(dateKey, a.approvalId);
      }
      return entry;
    });
    return NextResponse.json({ dateKey, actions: enriched });
  } catch {
    return NextResponse.json(
      { error: "Failed to load actions" },
      { status: 500 }
    );
  }
}
