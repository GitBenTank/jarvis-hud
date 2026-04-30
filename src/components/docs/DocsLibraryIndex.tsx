import Link from "next/link";
import type { ReactNode } from "react";
import type { DocsLibraryBuild, DocsLibraryCategory } from "@/lib/docs-library-index";

const mono =
  "[font-family:var(--font-docs-mono),ui-monospace,monospace]" as const;

const hudRouteLink =
  "text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200" as const;

/** Curated onboarding home — excludes ?library=all mega-index (see DocsTechnicalLibraryPage). */
function CardGrid({
  items,
}: {
  items: { href: string; title: string; description: string }[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5 transition-colors hover:border-sky-500/20 hover:bg-zinc-900/35"
          >
            <span className="text-[15px] font-medium leading-snug text-zinc-100">
              {item.title}
            </span>
            <span className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-500">
              {item.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function InvestorFifteenMinutePath({
  items,
}: {
  items: { href: string; title: string; description: string }[];
}) {
  return (
    <ol className="max-w-3xl list-none space-y-5">
      {items.map((item, index) => (
        <li key={item.href} className="flex gap-4 sm:gap-5">
          <span
            className={`${mono} flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-zinc-950/60 text-[13px] font-semibold text-zinc-300`}
            aria-hidden
          >
            {index + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <Link
              href={item.href}
              className="text-[16px] font-medium leading-snug text-zinc-100 underline-offset-2 hover:text-sky-200 hover:underline"
            >
              {item.title}
            </Link>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  sectionId,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  sectionId?: string;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <p
        className={`${mono} mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
      >
        {eyebrow}
      </p>
      <h2
        id={sectionId}
        className="text-xl font-medium tracking-tight text-zinc-50 sm:text-2xl"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function DocLinkRow({
  entry,
}: {
  entry: { href: string; title: string; pathLabel: string };
}) {
  return (
    <Link
      href={entry.href}
      className="group block rounded-lg py-1.5 transition-colors hover:bg-white/[0.03]"
    >
      <span className="block text-[15px] font-medium leading-snug text-zinc-200 group-hover:text-white">
        {entry.title}
      </span>
      <span
        className={`${mono} mt-0.5 block text-[11px] text-zinc-600 group-hover:text-zinc-500`}
      >
        docs/{entry.pathLabel}
      </span>
    </Link>
  );
}

function RouteRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2.5">{children}</div>
  );
}

function ExploreAdvancedSection({ stats }: Pick<DocsLibraryBuild, "stats">) {
  const links = [
    {
      label: "Technical library",
      href: "/docs?library=all",
      hint: `${stats.totalFiles} markdown files grouped by topic`,
    },
    {
      label: "Setup & operations",
      href: "/docs/setup/local-stack-startup",
      hint: "Local stack startup, terminals, blessed paths",
    },
    {
      label: "Architecture",
      href: "/docs/architecture/jarvis-openclaw-system-overview",
      hint: "Capability vs control plane — how components connect",
    },
    {
      label: "Security",
      href: "/docs/architecture/security-model",
      hint: "Execution risk, ingress, enforcement",
    },
    {
      label: "Integrations",
      href: "/docs/openclaw-integration-verification",
      hint: "OpenClaw ↔ Jarvis ingress, signing, troubleshooting",
    },
    {
      label: "Runbooks",
      href: "/docs/live-demo-reliability-checklist",
      hint: "Demos and rehearsal drills",
    },
  ] as const;

  return (
    <details className="group mt-16 rounded-2xl border border-white/[0.08] bg-zinc-950/25 [&_summary::-webkit-details-marker]:hidden">
      <summary
        id="explore-deeper-heading"
        className={`cursor-pointer list-none px-6 py-5 sm:px-8 sm:py-6 ${mono} flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:text-zinc-200`}
      >
        <span>Explore deeper · advanced</span>
        <span
          aria-hidden
          className="text-[10px] text-zinc-500 transition-transform group-open:rotate-180"
        >
          ▼
        </span>
      </summary>
      <div className="border-t border-white/[0.06] px-6 pb-8 pt-2 sm:px-8 sm:pb-10">
        <p className="mb-6 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
          Operators, integrators, and diligence-heavy readers skip here—not part of onboarding or
          the investor-first path.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-xl border border-white/[0.06] bg-black/25 px-4 py-4 transition-colors hover:border-sky-500/20 hover:bg-zinc-950/60"
              >
                <span className="block text-[15px] font-medium text-zinc-100">{item.label}</span>
                <span className={`${mono} mt-1.5 block text-[11px] leading-relaxed text-zinc-500`}>
                  {item.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function DocsOnboardingHub({ library }: { library: DocsLibraryBuild }) {
  const { newcomers, investors, stats } = library;

  return (
    <div className="min-h-dvh px-4 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Back to HUD" className="flex flex-wrap items-center justify-between gap-4">
          <RouteRow>
            <Link href="/" className={hudRouteLink}>
              ← HUD
            </Link>
          </RouteRow>
          <RouteRow>
            <Link
              href="/docs?library=all"
              className={`${mono} text-[11px] font-medium text-zinc-500 hover:text-zinc-300`}
            >
              Full library index ({stats.totalFiles} files)
            </Link>
          </RouteRow>
        </nav>

        <header className="mt-10 max-w-3xl border-b border-white/[0.08] pb-10">
          <p
            className={`${mono} mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
          >
            Jarvis HUD
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-zinc-50 sm:text-[2.25rem] sm:leading-tight">
            Documentation
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-[1.75] text-zinc-400">
            As agents begin to take real actions—sending emails, modifying code, triggering APIs—the{" "}
            <strong className="font-medium text-zinc-200">boundary between decision and execution</strong>{" "}
            becomes the failure point.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-[1.75] text-zinc-400">
            <strong className="font-medium text-zinc-200">Most systems log what happened.</strong> Jarvis
            proves who decided, who executed, and what actually occurred—
            <strong className="font-medium text-zinc-200"> at the boundary where failures happen</strong>.
            It is the <strong className="font-medium text-zinc-200">authority layer</strong> for governed
            AI: agents and tools can propose; <strong className="font-medium text-zinc-200">people</strong>{" "}
            own approval and execution. Trust comes from proof—not from the model sounding confident.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Start with proof. Then understand why it matters. Then see how it scales. This fold is paced
            for diligence:{" "}
            <strong className="font-medium text-zinc-400">open the live demo</strong>, skim the thesis
            in plain English (no install), then walk the numbered investor path. Operators and stacks
            live under <strong className="font-medium text-zinc-400">Explore deeper · advanced</strong>{" "}
            below—not on this fold.
          </p>
        </header>

        <section
          aria-labelledby="start-here-investors-heading"
          className="mt-10 rounded-2xl border border-sky-500/25 bg-gradient-to-b from-sky-950/40 to-zinc-950/30 p-6 sm:p-8"
        >
          <h2
            id="start-here-investors-heading"
            className="text-xl font-medium tracking-tight text-zinc-50 sm:text-2xl"
          >
            Start here — see Jarvis in action
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-[15px] sm:leading-[1.7]">
            <strong className="font-medium text-zinc-300">This is not a simulation. This is a governed action.</strong>
            <br />
            <span className="text-zinc-400">
              Six slides into the live HUD:{" "}
            </span>
            <strong className="font-medium text-zinc-300">
              Agents propose. Humans approve. Execution is separate.
            </strong>{" "}
            Every action leaves a receipt and a trace.{" "}
            <span className="text-zinc-300">Autonomy in thinking; authority in action.</span>
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-sky-900/30 transition hover:bg-sky-400"
            >
              Open live demo
            </Link>
            <Link
              href="/docs/tati"
              className={`${mono} inline-flex items-center justify-center rounded-xl border border-white/[0.12] bg-zinc-950/50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100`}
            >
              Investor pack · 15 min control-plane read
            </Link>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="newcomers-heading">
          <SectionTitle
            eyebrow="New here"
            sectionId="newcomers-heading"
            title="Start without the stack"
            subtitle="No install required to understand what Jarvis is and why it exists."
          />
          <CardGrid items={newcomers} />
        </section>

        <section className="mt-14" aria-labelledby="investors-heading">
          <SectionTitle
            eyebrow="Investors"
            sectionId="investors-heading"
            title="For investors — understand the control plane in 15 minutes"
            subtitle="Start with proof. Then understand why it matters. Then see how it scales."
          />
          <InvestorFifteenMinutePath items={investors} />
        </section>

        <ExploreAdvancedSection stats={stats} />

        <p
          className={`${mono} mx-auto mt-16 max-w-lg text-center text-[11px] leading-relaxed text-zinc-600`}
        >
          Policy:{" "}
          <Link href="/docs/README" className="text-zinc-500 underline-offset-2 hover:text-zinc-400">
            what we show in this UI vs. repo-only
          </Link>
          . Example path{" "}
          <code className="text-zinc-500">docs/strategy/thesis.md</code>
          {" → "}
          <code className="text-zinc-500">/docs/strategy/thesis</code>
        </p>
      </div>
    </div>
  );
}

function DocsTechnicalLibraryPage({ library }: { library: DocsLibraryBuild }) {
  const categories: DocsLibraryCategory[] = library.fullCategories;
  const { stats } = library;

  return (
    <div className="min-h-dvh px-4 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Docs navigation" className="flex flex-wrap items-center justify-between gap-4">
          <RouteRow>
            <Link href="/" className={hudRouteLink}>
              ← HUD
            </Link>
            <Link href="/demo" className={hudRouteLink}>
              Live demo
            </Link>
          </RouteRow>
          <RouteRow>
            <Link
              href="/docs"
              className={`${mono} text-[11px] font-medium text-sky-400/90 hover:text-sky-300`}
            >
              Curated docs home
            </Link>
          </RouteRow>
        </nav>

        <header className="mt-10 max-w-3xl border-b border-white/[0.08] pb-10">
          <p
            className={`${mono} mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
          >
            Advanced
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-zinc-50 sm:text-[2.25rem] sm:leading-tight">
            Technical library
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Everything under <code className={`${mono} text-[12px] text-zinc-400`}>docs/</code>,
            grouped by area. Internal or research drafts may still resolve via URL or repo; titles
            default to each file’s first heading.
          </p>
          <p className={`${mono} mt-3 text-[11px] text-zinc-600`}>
            {stats.totalFiles} markdown files indexed · curated view listed {stats.listedInPublicIndex}{" "}
            publicly
          </p>
        </header>

        <section className="mt-12" aria-label="Markdown files grouped by category">
          <div className="grid gap-6 lg:grid-cols-2">
            {categories.map((cat: DocsLibraryCategory) => (
              <div
                key={cat.id}
                className="flex flex-col rounded-2xl border border-white/[0.06] bg-black/25 p-6 sm:p-7"
              >
                <h3 className="text-lg font-medium tracking-tight text-zinc-100">{cat.label}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{cat.description}</p>
                <p
                  className={`${mono} mt-4 text-[11px] text-zinc-600`}
                  aria-label={`${cat.entries.length} documents in this section`}
                >
                  {cat.entries.length}{" "}
                  {cat.entries.length === 1 ? "document" : "documents"}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
                  {cat.entries.map((e) => (
                    <DocLinkRow key={e.href} entry={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <p
          className={`${mono} mx-auto mt-16 max-w-lg text-center text-[11px] leading-relaxed text-zinc-600`}
        >
          Policy:{" "}
          <Link href="/docs/README" className="text-zinc-500 underline-offset-2 hover:text-zinc-400">
            what we show in curated vs index views
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export function DocsLibraryIndex({
  library,
  showFullTechnicalIndex,
}: {
  library: DocsLibraryBuild;
  showFullTechnicalIndex: boolean;
}) {
  if (showFullTechnicalIndex) {
    return <DocsTechnicalLibraryPage library={library} />;
  }
  return <DocsOnboardingHub library={library} />;
}
