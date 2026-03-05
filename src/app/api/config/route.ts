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

    const irreversibleConfirmEnabled =
      (process.env.JARVIS_UI_CONFIRM_IRREVERSIBLE ??
        process.env.JARVIS_IRREVERSIBLE_CONFIRM_ENABLED) !== "false";
    const ingressValidationEnabled =
      process.env.JARVIS_INGRESS_OPENCLAW_VALIDATE !== "false";

    return NextResponse.json({
      jarvisRoot: getJarvisRoot(),
      authEnabled: isAuthEnabled(),
      irreversibleConfirmEnabled,
      ingressValidationEnabled,
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
