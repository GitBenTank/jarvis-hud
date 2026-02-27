import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { ensurePathAllowed } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pathInput = body?.path;
    const app = body?.app ?? "finder";

    if (typeof pathInput !== "string" || !pathInput.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid path" },
        { status: 400 }
      );
    }
    if (app !== "finder" && app !== "cursor") {
      return NextResponse.json(
        { error: "Invalid app; use 'finder' or 'cursor'" },
        { status: 400 }
      );
    }

    const resolved = pathInput.trim();
    ensurePathAllowed(resolved);

    const appName = app === "finder" ? "Finder" : "Cursor";
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("open", ["-a", appName, resolved], {
        stdio: "ignore",
      });
      proc.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(`open exited ${code}`))
      );
      proc.on("error", reject);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Path not under allowed roots") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to open path" },
      { status: 500 }
    );
  }
}
