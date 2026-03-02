import { NextResponse } from "next/server";
import { getJarvisRoot } from "@/lib/storage";
import { isAuthEnabled } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    jarvisRoot: getJarvisRoot(),
    authEnabled: isAuthEnabled(),
  });
}
