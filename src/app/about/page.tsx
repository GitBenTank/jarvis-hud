import Link from "next/link";
import SystemStatus from "@/components/SystemStatus";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to HUD
          </Link>
          <Link
            href="/activity"
            className="text-sm font-medium text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Activity
          </Link>
        </div>

        <h1 className="mb-6 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          About Jarvis HUD
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Jarvis is the{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            approval and proof layer
          </span>{" "}
          for agent systems: explicit authority boundaries, separated approve and execute steps, and
          reconstructable receipts and traces—not an agent builder. For positioning and competitive
          context, see{" "}
          <Link
            href="/docs/strategy/competitive-landscape-2026"
            className="font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Competitive landscape (2026)
          </Link>
          .
        </p>

        <div className="space-y-8">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Runtime Control Plane</h2>
            <div className="mt-3 flex flex-col gap-1 text-sm">
              <div>
                <span className="font-medium text-zinc-500">Agent:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Local runtime active</span>
              </div>
              <div>
                <span className="font-medium text-zinc-500">Execution Mode:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Dry Run</span>
              </div>
              <div>
                <span className="font-medium text-zinc-500">Authority Model:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Human-gated</span>
              </div>
              <div>
                <span className="font-medium text-zinc-500">Cognition Layer:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Background agent loop</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Execution Authority (Thesis Lock)</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <span className="font-medium text-zinc-500">Mode:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Human-gated</span>
              </li>
              <li>
                <span className="font-medium text-zinc-500">Approval ≠ Execution</span>
              </li>
              <li>
                <span className="font-medium text-zinc-500">Posting adapters:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Disabled (no external posting)</span>
              </li>
              <li>
                <span className="font-medium text-zinc-500">External API access:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Off (for now)</span>
              </li>
              <li>
                <span className="font-medium text-zinc-500">Receipts:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Required (artifact + action log)</span>
              </li>
              <li>
                <span className="font-medium text-zinc-500">Trusted principal:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">Human (not the model)</span>
              </li>
            </ul>
            <hr className="mt-4 mb-3 border-t border-zinc-300 dark:border-zinc-700" />
            <div className="text-center">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                — EXECUTION BOUNDARY —
              </div>
              <div className="space-y-0.5 text-base font-bold text-zinc-800 dark:text-zinc-200">
                <div>Autonomy in thinking.</div>
                <div>Authority in action.</div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Security Posture (Zero Trust)</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="font-medium text-zinc-600 dark:text-zinc-400">Threats we defend against</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-600 dark:text-zinc-400">
                  <li>Prompt injection / tool misuse</li>
                  <li>Stolen session / stolen account</li>
                  <li>Data exfil via tool outputs</li>
                  <li>Confused deputy (model tricks tool permissions)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-zinc-600 dark:text-zinc-400">
                  Current controls{" "}
                  <span className="inline-block rounded border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Execution Policy: enforced
                  </span>
                </p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-600 dark:text-zinc-400">
                  <li>Human-gated execution (approve ≠ execute)</li>
                  <li>External API access: OFF (for now)</li>
                  <li>Posting adapters: disabled</li>
                  <li>Receipts: required (artifact + action log)</li>
                  <li>Deterministic packaging (local files only)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-zinc-500 dark:text-zinc-500">
                  Controls (planned) <span className="text-xs italic">(roadmap, not implemented)</span>
                </p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                  <li>Re-authentication to execute (step-up)</li>
                  <li>Execution allowlist per kind (capabilities)</li>
                  <li>Trusted ingress allowlists (reduce prompt injection surface)</li>
                  <li>Scoped connector identities (separate accounts / service principals)</li>
                  <li>Key limits and alerts (policy-gated outbound)</li>
                  <li>Session TTL + device binding</li>
                  <li>Rate limits + audit alerts</li>
                  <li>Sanitization / injection checks on rendered content</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-xs italic text-zinc-500 dark:text-zinc-400">
              Zero Trust: never trust, always verify.
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">System</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Auth, config, and dev reset controls.
            </p>
            <div className="mt-4">
              <SystemStatus />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
