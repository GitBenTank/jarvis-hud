"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/**
 * When auth is on, surfaces Establish session / Step up on the home shell so operators
 * are not dependent on discovering About → System status first.
 */
export default function HomeSessionCta() {
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [stepUpValid, setStepUpValid] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status", { credentials: "include" });
      if (!res.ok) return;
      const j = (await res.json()) as {
        authEnabled?: boolean;
        hasSession?: boolean;
        stepUpValid?: boolean;
      };
      if (typeof j.authEnabled !== "boolean") return;
      setAuthEnabled(j.authEnabled);
      setHasSession(j.hasSession === true);
      setStepUpValid(j.stepUpValid === true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    const onRefresh = () => void refresh();
    globalThis.addEventListener("jarvis-refresh", onRefresh);
    return () => {
      clearInterval(id);
      globalThis.removeEventListener("jarvis-refresh", onRefresh);
    };
  }, [refresh]);

  const onEstablish = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/init", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        globalThis.dispatchEvent(new CustomEvent("jarvis-refresh"));
      }
    } finally {
      setBusy(false);
      void refresh();
    }
  }, [refresh]);

  const onStepUp = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/step-up", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        globalThis.dispatchEvent(new CustomEvent("jarvis-refresh"));
      }
    } finally {
      setBusy(false);
      void refresh();
    }
  }, [refresh]);

  if (authEnabled !== true) {
    return null;
  }

  if (!hasSession) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-2">
        <section
          className="flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
          aria-label="HUD session"
        >
          <p className="min-w-0">
            <span className="font-medium">HUD session required</span>
            <span className="mt-0.5 block text-xs opacity-90">
              Proposals, receipts, and activity are session-gated. Use the same host as{" "}
              <code className="rounded bg-black/10 px-1 dark:bg-white/10">JARVIS_HUD_BASE_URL</code>{" "}
              (e.g. <code className="rounded bg-black/10 px-1 dark:bg-white/10">127.0.0.1</code>).
            </span>
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void onEstablish()}
              disabled={busy}
              className="rounded border border-amber-700/50 bg-amber-200/80 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-200 disabled:opacity-50 dark:border-amber-500/50 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/50"
            >
              {busy ? "…" : "Establish session"}
            </button>
            <Link
              href="/about#system-status"
              className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:no-underline dark:text-amber-200"
            >
              About → System status
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!stepUpValid) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-2">
        <section
          className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Step-up for execute"
        >
          <p className="min-w-0">
            <span className="font-medium">Step-up required to execute</span>
            <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
              Session is active (lists load). Confirm step-up before running gated executes.
            </span>
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void onStepUp()}
              disabled={busy}
              className="rounded border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40"
            >
              {busy ? "…" : "Step up"}
            </button>
            <Link
              href="/about#system-status"
              className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              About → System status
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
