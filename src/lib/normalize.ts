export function normalizeAction(payload: unknown): {
  kind: string;
  summary: string;
  channel?: string;
  title?: string;
  body?: string;
  note?: string;
  tags?: string[];
  dryRun?: boolean;
} {
  if (!payload || typeof payload !== "object") {
    return { kind: "unknown", summary: "Unknown action" };
  }

  const p = payload as Record<string, unknown>;

  if (p.kind === "system.note") {
    const title = String(p.title ?? "(untitled)");
    return {
      kind: "system.note",
      summary: title,
      title,
      note: String(p.note ?? ""),
      tags: Array.isArray(p.tags) ? p.tags.map(String) : undefined,
    };
  }

  if (p.kind === "reflection.note") {
    const sourceKind = String(p.sourceKind ?? "unknown");
    const sourceApprovalId = String(p.sourceApprovalId ?? "");
    return {
      kind: "reflection.note",
      summary: `Reflection: ${sourceKind} · ${sourceApprovalId.slice(0, 8)}`,
    };
  }

  if (p.kind === "code.diff") {
    const title = String(p.title ?? "(untitled)");
    const code = p.code as Record<string, unknown> | undefined;
    const summary =
      (typeof code?.summary === "string" ? code.summary : "") ||
      title ||
      "Code diff (dry-run)";
    return {
      kind: "code.diff",
      summary,
      title,
    };
  }

  const isPublish =
    p.kind === "content.publish" ||
    p.action === "publish" ||
    (p.target && p.title);

  if (isPublish) {
    const channel = p.channel ?? p.target ?? "unknown";
    const title = p.title ?? "(untitled)";
    const body = p.body ?? "";
    const titleStr = typeof title === "object" ? JSON.stringify(title) : String(title);
    return {
      kind: "content.publish",
      channel: typeof channel === "object" ? JSON.stringify(channel) : String(channel),
      title: titleStr,
      body: typeof body === "object" ? JSON.stringify(body) : String(body),
      dryRun: typeof p.dryRun === "boolean" ? p.dryRun : true,
      summary: titleStr !== "(untitled)" ? titleStr : "Publish content",
    };
  }

  const fallbackKind = p.kind ?? p.action ?? "unknown";
  const kind =
    typeof fallbackKind === "string"
      ? fallbackKind
      : typeof fallbackKind === "object" && fallbackKind !== null
        ? JSON.stringify(fallbackKind)
        : String(fallbackKind);

  let summary: string;
  if (typeof p.title === "string") {
    summary = p.title;
  } else if (typeof p.message === "string") {
    summary = p.message;
  } else {
    summary = JSON.stringify(payload).slice(0, 40);
  }

  return { kind, summary };
}
