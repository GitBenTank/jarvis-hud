import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
} from "@/lib/storage";

type Event = {
  id: string;
  traceId?: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
};

type StatusFilter = "pending" | "approved" | "denied" | "all";

function isStatusFilter(s: string): s is StatusFilter {
  return ["pending", "approved", "denied", "all"].includes(s);
}

export async function GET(request: NextRequest) {
  try {
    const statusParam = request.nextUrl.searchParams.get("status");
    const status: StatusFilter = statusParam && isStatusFilter(statusParam)
      ? statusParam
      : "pending";

    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const events = await readJson<Event[]>(filePath);

    const all = events ?? [];
    const approvalEvents = all.filter((e) => e.requiresApproval === true);

    const filtered =
      status === "all"
        ? approvalEvents
        : approvalEvents.filter((e) => e.status === status);

    return NextResponse.json({ dateKey, approvals: filtered });
  } catch {
    return NextResponse.json(
      { error: "Failed to load approvals" },
      { status: 500 }
    );
  }
}
