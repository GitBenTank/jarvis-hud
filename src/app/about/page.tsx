import Link from "next/link";
import { AboutOperatorsPanel } from "@/components/about/AboutOperatorsPanel";

const mono =
  "[font-family:var(--font-docs-mono),ui-monospace,monospace]" as const;

function RouteLink({
  href,
  children,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  accent?: "activity";
}) {
  const base =
    accent === "activity"
      ? "text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
      : "text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200";
  return (
    <Link href={href} className={base}>
      {children}
    </Link>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <p className={`${mono} mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}>
        {eyebrow}
      </p>
      <h2 className="text-xl font-medium tracking-tight text-zinc-50 sm:text-2xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-sm leading-relaxed text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}

const LIFECYCLE = ["Propose", "Approve", "Execute", "Receipt"] as const;

const DIG_DEEPER = [
  {
    href: "/demo",
    title: "Demo",
    description: "See the HUD path end-to-end in a rehearsal flow.",
  },
  {
    href: "/docs/tati",
    title: "Investor read path",
    description: "A tight curated route through positioning and readiness.",
  },
  {
    href: "/docs/getting-started/welcome",
    title: "Welcome",
    description: "On-ramp vocabulary and where things live.",
  },
  {
    href: "/docs/strategy/competitive-landscape-2026",
    title: "Market context",
    description: "How this category is evolving and why the boundary matters.",
  },
  {
    href: "/docs",
    title: "Documentation home",
    description: "Full library — architecture, ops, governance.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <main className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <RouteLink href="/">← Back to HUD</RouteLink>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <RouteLink href="/docs">Docs</RouteLink>
            <RouteLink href="/demo">Demo</RouteLink>
            <RouteLink href="/activity" accent="activity">
              Activity
            </RouteLink>
          </div>
        </div>

        <header className="mb-12">
          <p className={`${mono} mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}>
            Narrative HUD
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">About Jarvis HUD</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-zinc-400">
            Assistants don&apos;t stop at chat anymore—they suggest emails, edits, tickets, deploys. The awkward
            question isn&apos;t intelligence; it&apos;s{" "}
            <strong className="font-medium text-zinc-100">
              who said yes, what actually ran, and whether you can show that later.
            </strong>{" "}
            Jarvis is the HUD for that boundary: propose, approve, execute—then{" "}
            <strong className="font-medium text-zinc-100">receipt and trace</strong>, not a story you half-remember.
          </p>

          <div
            aria-label="Governed lifecycle"
            className={`${mono} mt-8 flex flex-wrap items-center gap-y-3 text-[11px]`}
          >
            {LIFECYCLE.map((step, index) => (
              <span key={step} className="flex items-center">
                <span
                  className="rounded-full border border-white/[0.12] bg-zinc-950/80 px-3.5 py-2 font-semibold uppercase tracking-[0.14em] text-zinc-300 shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-sky-400/35 hover:bg-zinc-900/70 hover:text-zinc-100"
                >
                  {step}
                </span>
                {index < LIFECYCLE.length - 1 ? (
                  <span aria-hidden className="mx-2 shrink-0 text-zinc-600 sm:mx-2.5">
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>
          <p className={`${mono} mt-4 text-[11px] text-zinc-600`}>
            Prefer hands-on? Open{" "}
            <Link
              href="/activity"
              className="font-medium text-amber-400/90 transition-colors hover:text-amber-300"
            >
              Activity
            </Link>{" "}
            and walk the stream as it happens.
          </p>
        </header>

        <blockquote className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-zinc-950/85 to-zinc-900/35 p-6 ring-1 ring-inset ring-white/[0.04]">
          <div className="border-l-2 border-amber-500/55 pl-4">
            <p className={`${mono} text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/90`}>
              Thesis lock framing
            </p>
            <p className="mt-3 text-base font-semibold text-zinc-50">Autonomy in thinking. Authority in action.</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Agents can suggest anything. Serious outcomes wait for explicit human approval; execution stays a separate
              step with proof.
            </p>
          </div>
        </blockquote>

        <div className="mt-14 space-y-14">
          <section>
            <SectionTitle eyebrow="Outcomes" title="What you use Jarvis for" />
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-6 transition-colors hover:border-white/[0.12] hover:bg-zinc-900/[0.35]">
              <ul className="space-y-4 text-[15px] leading-relaxed text-zinc-400">
                <li className="flex gap-4">
                  <span className={`${mono} mt-1 shrink-0 text-amber-400/90`}>01</span>
                  <span>
                    See what was <strong className="text-zinc-200">proposed</strong> — before an effect hits mail, repos,
                    or tools you care about.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className={`${mono} mt-1 shrink-0 text-amber-400/90`}>02</span>
                  <span>
                    Decide with a clear <strong className="text-zinc-200">approval moment</strong> — not vibes in a
                    thread.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className={`${mono} mt-1 shrink-0 text-amber-400/90`}>03</span>
                  <span>
                    Walk away with a <strong className="text-zinc-200">receipt and trace</strong> — reconstruct who
                    approved what actually ran when someone asks tomorrow.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <SectionTitle eyebrow="Boundaries" title="What Jarvis isn&apos;t" />
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-6 transition-colors hover:border-white/[0.12] hover:bg-zinc-900/[0.35]">
              <ul className="space-y-3 text-sm leading-relaxed text-zinc-500">
                <li className="flex gap-2">
                  <span aria-hidden className="text-zinc-600">
                    —
                  </span>
                  Another model vendor or “make the AI nicer” checkbox.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-zinc-600">
                    —
                  </span>
                  A guarantee that nobody can misuse software elsewhere — it&apos;s honest about boundaries (
                  <Link
                    href="/docs/trust-boundary"
                    className="font-medium text-amber-400/90 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                  >
                    trust boundary
                  </Link>
                  ).
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-zinc-600">
                    —
                  </span>
                  A replacement for agents or frameworks — Jarvis sits where{" "}
                  <strong className="text-zinc-300">decisions become real</strong>.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <SectionTitle
              eyebrow="Explore"
              title="Dig deeper"
              subtitle="Same spirit as Documentation — tactile cards instead of an inline laundry list."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DIG_DEEPER.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex h-full min-h-[7.75rem] flex-col rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5 transition-colors hover:border-sky-500/20 hover:bg-zinc-900/35"
                  >
                    <span className="text-[15px] font-medium leading-snug text-zinc-100">{item.title}</span>
                    <span className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-500">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionTitle eyebrow="Trust" title="Trust — in plain English" />
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-6 transition-colors hover:border-white/[0.12]">
              <p className="text-sm leading-relaxed text-zinc-400">
                <strong className="text-zinc-100">Approve is not execute.</strong> Saying yes to a proposal and running the
                effect are intentionally separate — you can inspect, simulate, then commit. Outcomes worth defending leave{" "}
                <strong className="text-zinc-200">receipts and traces</strong> so audits and postmortems have something
                solid to bite.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                The model isn&apos;t the trusted principal — you are. Formal rules live in{" "}
                <Link
                  href="/docs/decisions/0001-thesis-lock"
                  className="font-medium text-amber-400/90 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                >
                  Thesis Lock
                </Link>
                .
              </p>
            </div>
          </section>

          <section>
            <SectionTitle eyebrow="Threat model" title="What we design against" />
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-6 transition-colors hover:border-white/[0.12]">
              <p className="text-sm leading-relaxed text-zinc-400">
                The usual failure modes aren&apos;t hypothetical — misused tools, leaked sessions, exfiltration through
                outputs, and models that stretch permissions they shouldn&apos;t. Jarvis biases toward humans in the loop,
                enforced policy, and records you can reconcile — not vibes.
              </p>
              <p className="mt-4 text-sm text-zinc-500">
                Detailed threats, ingress, and policy:{" "}
                <Link
                  href="/docs/architecture/security-model"
                  className="font-medium text-amber-400/90 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                >
                  Security model
                </Link>{" "}
                ·{" "}
                <Link
                  href="/docs/decisions/0003-execution-policy-v1"
                  className="font-medium text-amber-400/90 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                >
                  Execution policy
                </Link>
                .
              </p>
            </div>
          </section>

          <section id="system-status" className="scroll-mt-8">
            <SectionTitle
              eyebrow="Environment"
              title="Connection, auth & environment"
              subtitle="Operator controls stay one layer down so the story reads clean — open the panel when you need the HUD."
            />
            <AboutOperatorsPanel />
          </section>
        </div>
      </main>
    </div>
  );
}
