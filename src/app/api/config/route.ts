import { NextResponse } from "next/server";
import { getJarvisRoot } from "@/lib/storage";
import { isAuthEnabled, AuthConfigError } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({
      jarvisRoot: getJarvisRoot(),
      authEnabled: isAuthEnabled(),
    });
  } catch (err) {
    if (err instanceof AuthConfigError) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }
    throw err;
  }
}
