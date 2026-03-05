"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeAction } from "@/lib/normalize";
import { riskTierForKind, requiresIrreversibleConfirmation } from "@/lib/risk";

type Event = {
  id: string;
  payload: unknown;
  status: string;
  executed?: boolean;
};

type ApprovalsResponse = {
  approvals: Event[];
};

type GateState = "green" | "amber" | "red";

function riskTierToOrder(tier: string): number {
  if (tier === "CRITICAL") return 4;
  if (tier === "HIGH") return 3;
  if (tier === "MEDIUM") return 2;
  if (tier === "LOW") return 1;
  return 0;
}

const STATE_LABEL: Record<GateState, string> = {
  green: "GREEN",
  amber: "AMBER",
  red: "RED",
};

export default function SafetyGatePanel() {
  const [gateState, setGateState] = useState<GateState>("green");
  const [message, setMessage] = useState("No pending");
  const [nextStep, setNextStep] = useState("No action required");
  const [loading, setLoading] = useState(true);

  const fetchGateState = useCallback(async () => {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("/api/approvals?status=pending"),
        fetch("/api/approvals?status=approved"),
      ]);
      const pending = (await pendingRes.json()).approvals ?? [];
      const approved = (await approvedRes.json()).approvals ?? [];
      const approvedNotExecuted = approved.filter(
        (e: Event) => !e.executed
      ) as Event[];

      const allRelevant: Event[] = [...(pending as Event[]), ...approvedNotExecuted];
      const count = allRelevant.length;

      let highestTier: string = "LOW";
      let anyHighNeedsConfirm = false;

      for (const ev of allRelevant) {
        const n = normalizeAction(ev.payload);
        const tier = riskTierForKind(n.kind);
        if (riskTierToOrder(tier) > riskTierToOrder(highestTier)) {
          highestTier = tier;
        }
        if (ev.status === "approved" && !ev.executed && requiresIrreversibleConfirmation(n.kind)) {
          anyHighNeedsConfirm = true;
        }
      }

      let nextStep: string;
      if (count === 0) {
        setGateState("green");
        setMessage("No pending");
        nextStep = "No action required";
      } else if (anyHighNeedsConfirm || highestTier === "HIGH" || highestTier === "CRITICAL") {
        setGateState("red");
        setMessage("HIGH RISK requires typed confirmation");
        nextStep = anyHighNeedsConfirm
          ? "Type APPLY → Execute"
          : "Approve → Type APPLY → Execute";
      } else {
        setGateState("amber");
        setMessage(`Pending approval (${count})`);
        nextStep = `Approve (${count}) item${count === 1 ? "" : "s"}`;
      }
      setNextStep(nextStep);
    } catch {
      setGateState("green");
      setMessage("No pending");
      setNextStep("No action required");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGateState();
    const id = setInterval(fetchGateState, 5000);
    return () => clearInterval(id);
  }, [fetchGateState]);

  useEffect(() => {
    const handler = () => fetchGateState();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchGateState]);

  if (loading) {
    return (
      <div className="rounded border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
        Loading…
      </div>
    );
  }

  const stateClasses: Record<GateState, string> = {
    green:
      "border-emerald-600/50 bg-emerald-950/30 text-emerald-300 dark:border-emerald-500/50 dark:bg-emerald-950/20 dark:text-emerald-400",
    amber:
      "border-amber-600/50 bg-amber-950/30 text-amber-300 dark:border-amber-500/50 dark:bg-amber-950/20 dark:text-amber-400",
    red:
      "border-red-600/50 bg-red-950/30 text-red-300 dark:border-red-500/50 dark:bg-red-950/20 dark:text-red-400",
  };

  return (
    <div
      className={`rounded border px-3 py-2 font-medium tracking-wide ${stateClasses[gateState]}`}
      aria-live="polite"
    >
      <div className="text-[10px] uppercase tracking-widest opacity-90">
        SAFETY GATE: {STATE_LABEL[gateState]}
      </div>
      <div className="mt-0.5 font-semibold">{message}</div>
      <div className="mt-1 text-[10px] opacity-90">Next required step: {nextStep}</div>
    </div>
  );
}
