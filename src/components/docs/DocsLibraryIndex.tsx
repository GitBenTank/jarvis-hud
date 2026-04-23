import Link from "next/link";
import type { ReactNode } from "react";

const mono =
  "[font-family:var(--font-docs-mono),ui-monospace,monospace]" as const;

const sectionLabel = `${mono} mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500`;

/** Matches HUD nav links on `/` — `dark:` branch from `src/app/page.tsx` */
const hudRouteLink =
  "text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200" as const;

const hudRouteLinkActivity =
  "text-sm font-medium text-amber-400 transition-colors hover:text-amber-300" as const;

function RouteLink({
  href,
  children,
  accent,
}: {
  href: string;
  children: ReactNode;
  accent?: "activity";
}) {
  return (
    <Link
      href={href}
      className={accent === "activity" ? hudRouteLinkActivity : hudRouteLink}
    >
      {children}
    </Link>
  );
}

function RouteRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2.5 px-2 sm:mx-auto">
      {children}
    </div>
  );
}

function DocSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.06] pt-6 sm:pt-8">
      <span className={sectionLabel}>{title}</span>
      {children}
    </section>
  );
}

export function DocsLibraryIndex() {
  return (
    <div className="flex min-h-dvh flex-col px-4 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col text-center">
        <nav aria-label="Back to HUD">
          <RouteRow>
            <Link href="/" className={hudRouteLink}>
              ← HUD
            </Link>
          </RouteRow>
        </nav>

        <header className="mx-auto mt-8 max-w-xl sm:mt-10">
          <h1 className="text-3xl font-medium tracking-tight text-zinc-50 sm:text-[2.125rem] sm:leading-tight">
            Docs library
          </h1>
          <p className="mt-4 text-sm leading-[1.65] text-zinc-400">
            Files in the repo under{" "}
            <code className={`${mono} text-[13px] text-zinc-300`}>docs/</code>{" "}
            are served at{" "}
            <code className={`${mono} text-[13px] text-zinc-300`}>/docs/…</code>{" "}
            without the{" "}
            <code className={`${mono} text-[13px] text-zinc-300`}>.md</code>{" "}
            suffix. On any doc, switch to{" "}
            <strong className="font-medium text-zinc-200">Slides</strong> for a
            full-screen pass split on{" "}
            <code className={`${mono} text-[13px] text-zinc-300`}>##</code>{" "}
            headings.
          </p>
        </header>

        <div className="mx-auto mt-10 flex w-full max-w-3xl flex-1 flex-col justify-between gap-y-6 py-6 sm:mt-12 sm:gap-y-8 sm:py-8">
          <DocSection title="Short paths">
            <RouteRow>
              <RouteLink href="/library">/library</RouteLink>
              <RouteLink href="/pitch">/pitch</RouteLink>
              <RouteLink href="/playbook">/playbook</RouteLink>
              <RouteLink href="/thesis">/thesis</RouteLink>
            </RouteRow>
          </DocSection>

          <DocSection title="In-app routes">
            <RouteRow>
              <RouteLink href="/">HUD</RouteLink>
              <RouteLink href="/activity" accent="activity">
                Activity
              </RouteLink>
              <RouteLink href="/docs">Docs</RouteLink>
              <RouteLink href="/demo">Demo</RouteLink>
              <RouteLink href="/about">About</RouteLink>
            </RouteRow>
          </DocSection>

          <DocSection title="Investor & pitch">
            <RouteRow>
              <RouteLink href="/docs/strategy/gener8tor-pitch">
                Gener8tor pitch
              </RouteLink>
              <RouteLink href="/docs/strategy/room-playbook-v1">
                Room playbook
              </RouteLink>
              <RouteLink href="/docs/strategy/investor-demo-narrative-script">
                Narration script
              </RouteLink>
              <RouteLink href="/docs/video/investor-demo-full-runbook">
                Operator runbook
              </RouteLink>
              <RouteLink href="/docs/strategy/pitch-narrative-outline">
                Pitch outline
              </RouteLink>
              <RouteLink href="/docs/strategy/competitive-landscape-2026">
                Competitive landscape
              </RouteLink>
              <RouteLink href="/docs/video/90s-proof-demo">90s proof demo</RouteLink>
              <RouteLink href="/docs/strategy/investor-fundraising-deck-outline">
                Fundraising deck outline
              </RouteLink>
            </RouteRow>
          </DocSection>

          <DocSection title="Strategy & thesis">
            <RouteRow>
              <RouteLink href="/docs/strategy/jarvis-hud-video-thesis">
                Video thesis
              </RouteLink>
              <RouteLink href="/docs/decisions/0001-thesis-lock">ADR-0001</RouteLink>
              <RouteLink href="/docs/strategy/operating-assumptions">
                Operating assumptions
              </RouteLink>
              <RouteLink href="/docs/strategy/agent-team-v1">Agent team v1</RouteLink>
              <RouteLink href="/docs/roadmap/0003-operator-integration-phases">
                Operator roadmap
              </RouteLink>
              <RouteLink href="/docs/strategy/research-batch-workflow-v1">
                Research batch workflow
              </RouteLink>
              <RouteLink href="/docs/strategy/creative-batch-workflow-v1">
                Creative batch workflow
              </RouteLink>
            </RouteRow>
          </DocSection>

          <DocSection title="Setup & verification">
            <RouteRow>
              <RouteLink href="/docs/setup/openclaw-jarvis-operator-checklist">
                Operator checklist
              </RouteLink>
              <RouteLink href="/docs/setup/phase1-freeze-checklist">
                Phase 1 freeze
              </RouteLink>
              <RouteLink href="/docs/local-verification-openclaw-jarvis">
                Local verification
              </RouteLink>
              <RouteLink href="/docs/setup/env">Environment</RouteLink>
              <RouteLink href="/docs/setup/local-dev-truth-map">Dev truth map</RouteLink>
            </RouteRow>
          </DocSection>

          <DocSection title="Research & security">
            <RouteRow>
              <RouteLink href="/docs/research/video-insights/insight-index">
                Video insights
              </RouteLink>
              <RouteLink href="/docs/security/trusted-ingress">
                Trusted ingress
              </RouteLink>
            </RouteRow>
          </DocSection>
        </div>

        <p
          className={`${mono} mx-auto mt-auto max-w-md pt-8 text-center text-[11px] leading-relaxed text-zinc-600 sm:pt-10`}
        >
          Example{" "}
          <code className="text-zinc-500">docs/strategy/thesis.md</code>
          {" → "}
          <code className="text-zinc-500">/docs/strategy/thesis</code>
        </p>
      </main>
    </div>
  );
}
