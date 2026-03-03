import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getJarvisRoot } from "@/lib/storage";
import { isAuthEnabled, AuthConfigError } from "@/lib/auth";
import { isCodeApplyAvailable } from "@/lib/code-apply";
import {
  isIngressEnabled,
  getIngressSecret,
  getConnectorAllowlist,
} from "@/lib/ingress-openclaw";

export async function GET() {
  try {
    const allowlist = getConnectorAllowlist();
    const openclawAllowed = allowlist.has("openclaw");

    return NextResponse.json({
      jarvisRoot: getJarvisRoot(),
      authEnabled: isAuthEnabled(),
      codeApplyAvailable: isCodeApplyAvailable(),
      ingressOpenclawEnabled:
        isIngressEnabled() && getIngressSecret() !== null,
      connectorAllowlist: [...allowlist],
      openclawAllowed,
      serverTime: new Date().toISOString(),
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
