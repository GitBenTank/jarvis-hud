import { NextResponse } from "next/server";
import { getJarvisRoot } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({
    jarvisRoot: getJarvisRoot(),
  });
}
