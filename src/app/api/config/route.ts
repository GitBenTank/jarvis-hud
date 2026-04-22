import { NextRequest, NextResponse } from "next/server";

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
import {
  isAuthEnabled,
  AuthConfigError,
  getSessionFromCookie,
  isStepUpValid,
} from "@/lib/auth";
import { isCodeApplyAvailable, getCodeApplyBlockReasons } from "@/lib/code-apply";
import {
  isIngressEnabled,
  getIngressSecret,
  getConnectorAllowlist,
} from "@/lib/ingress-openclaw";
import { buildRuntimePosture } from "@/lib/runtime-posture";
import { scanOpenClawRecentSignals } from "@/lib/openclaw-health";
import { loadExecutionAllowedRoots } from "@/lib/execution-scope";
import {
  buildExecutionCapabilities,
  executionCapabilitiesShortLabel,
} from "@/lib/execution-surface";
import { computeIntegrationIssues } from "@/lib/integration-readiness";
import {
  isIntegrationDebugEnabled,
  probeControlUiReachability,
} from "@/lib/integration-debug-probe";

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

/**
 * Exposes configured `JARVIS_HUD_BASE_URL` for client-side comparison with `window.location`.
 * Not a secret; helps operators catch port / origin drift in local dev.
 */
function getJarvisHudBaseUrlConfigured(): string | null {
  const raw = process.env.JARVIS_HUD_BASE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Optional outbound link to the OpenClaw Control UI (gateway dashboard).
 * Set in Jarvis env only — does not configure OpenClaw; operators use it to jump from HUD → runtime.
 */
function getOpenClawControlUiUrlConfigured(): string | null {
  const raw = process.env.OPENCLAW_CONTROL_UI_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getDemoEmailConfigured(): boolean {
  const u = process.env.DEMO_EMAIL_USER?.trim();
  const p = process.env.DEMO_EMAIL_PASS?.trim();
  return Boolean(u && p);
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

export async function GET(request: NextRequest) {
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
    const authEnabled = isAuthEnabled();
    let stepUpValid: boolean | null = null;
    if (authEnabled) {
      const session = getSessionFromCookie(request.headers.get("cookie"));
      stepUpValid = session !== null && isStepUpValid(session);
    }
    const executionScopeEnforced = loadExecutionAllowedRoots().length > 0;
    const codeApplyBlockReasons = getCodeApplyBlockReasons();
    const executionCapabilities = buildExecutionCapabilities();

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
    const openClawSignals = await scanOpenClawRecentSignals();
    const runtimePosture = {
      ...buildRuntimePosture({
        events,
        actions,
        policyDecisions,
        authEnabled,
        ingressEnabled: ingressOpenclawEnabled,
        safetyOn: irreversibleConfirmEnabled && ingressValidationEnabled,
      }),
      lastOpenClawProposalAt: openClawSignals.lastProposalAt,
    };

    const integrationIssues = await computeIntegrationIssues();

    const integrationDebugEnabled = isIntegrationDebugEnabled();
    const openclawControlUiUrlConfigured = getOpenClawControlUiUrlConfigured();
    let openclawControlUiProbe: Awaited<
      ReturnType<typeof probeControlUiReachability>
    > | null = null;
    if (integrationDebugEnabled && openclawControlUiUrlConfigured) {
      openclawControlUiProbe = await probeControlUiReachability(
        openclawControlUiUrlConfigured
      );
    }

    return NextResponse.json({
      jarvisRoot: getJarvisRoot(),
      jarvisHudBaseUrl: getJarvisHudBaseUrlConfigured(),
      openclawControlUiUrl: openclawControlUiUrlConfigured,
      authEnabled,
      irreversibleConfirmEnabled,
      ingressValidationEnabled,
      codeApplyAvailable: isCodeApplyAvailable(),
      ingressOpenclawEnabled,
      connectorAllowlist: [...allowlist],
      openclawAllowed,
      serverTime: new Date().toISOString(),
      /** Canonical operator posture: same fields agents should use (GET /api/config + cookies for step-up). */
      trustPosture: {
        stepUpValid,
        executionScopeEnforced,
        codeApplyBlockReasons,
        executionCapabilities,
        executionSurfaceLabel: executionCapabilitiesShortLabel(executionCapabilities),
      },
      runtimePosture,
      integrationIssues,
      integrationDebugEnabled,
      demoEmailConfigured: getDemoEmailConfigured(),
      openclawControlUiProbe,
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
