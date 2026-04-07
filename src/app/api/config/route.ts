import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { promises as fs } from "node:fs";
import {
  getJarvisRoot,
  getDateKey,
  getEventsFilePath,
  getActionsFilePath,
  getPolicyDecisionsFilePath,
  readJson,
} from "@/lib/storage";
import { isAuthEnabled, AuthConfigError } from "@/lib/auth";
import { isCodeApplyAvailable } from "@/lib/code-apply";
import {
  isIngressEnabled,
  getIngressSecret,
  getConnectorAllowlist,
} from "@/lib/ingress-openclaw";
import { buildRuntimePosture } from "@/lib/runtime-posture";

type ActionLogEntry = {
  traceId?: string;
  at?: string;
  kind?: string;
  status?: string;
};

async function readActionLog(dateKey: string): Promise<ActionLogEntry[]> {
  try {
    const content = await fs.readFile(getActionsFilePath(dateKey), "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ActionLogEntry);
  } catch {
    return [];
  }
}

async function readPolicyDecisions(dateKey: string): Promise<Array<{ decision?: "allow" | "deny"; reason?: string; timestamp?: string }>> {
  try {
    const content = await fs.readFile(getPolicyDecisionsFilePath(dateKey), "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { decision?: "allow" | "deny"; reason?: string; timestamp?: string });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const allowlist = getConnectorAllowlist();
    const openclawAllowed = allowlist.has("openclaw");

    const irreversibleConfirmEnabled =
      (process.env.JARVIS_UI_CONFIRM_IRREVERSIBLE ??
        process.env.JARVIS_IRREVERSIBLE_CONFIRM_ENABLED) !== "false";
    const ingressValidationEnabled =
      process.env.JARVIS_INGRESS_OPENCLAW_VALIDATE !== "false";
    const ingressOpenclawEnabled =
      isIngressEnabled() && getIngressSecret() !== null;
    const dateKey = getDateKey();
    const events =
      (await readJson<
        Array<{
          id: string;
          traceId?: string;
          status?: string;
          createdAt?: string;
          approvedAt?: string;
          executedAt?: string;
          executed?: boolean;
          payload?: unknown;
        }>
      >(getEventsFilePath(dateKey))) ?? [];
    const actions = await readActionLog(dateKey);
    const policyDecisions = await readPolicyDecisions(dateKey);
    const runtimePosture = buildRuntimePosture({
      events,
      actions,
      policyDecisions,
      authEnabled: isAuthEnabled(),
      ingressEnabled: ingressOpenclawEnabled,
      safetyOn: irreversibleConfirmEnabled && ingressValidationEnabled,
      mode: "dry-run",
    });

    return NextResponse.json({
      jarvisRoot: getJarvisRoot(),
      authEnabled: isAuthEnabled(),
      irreversibleConfirmEnabled,
      ingressValidationEnabled,
      codeApplyAvailable: isCodeApplyAvailable(),
      ingressOpenclawEnabled,
      connectorAllowlist: [...allowlist],
      openclawAllowed,
      serverTime: new Date().toISOString(),
      runtimePosture,
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
