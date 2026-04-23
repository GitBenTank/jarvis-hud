import Link from "next/link";
import type { ReactNode } from "react";
import type {
  DocsLibraryCategory,
  DocsLibraryStartItem,
  DocsLibraryBuild,
} from "@/lib/docs-library-index";

const mono =
  "[font-family:var(--font-docs-mono),ui-monospace,monospace]" as const;

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
    <div className="flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2.5">
      {children}
    </div>
  );
}

function CardGrid({ items }: { items: DocsLibraryStartItem[] }) {
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

export function DocsLibraryIndex({
  library,
  showFullTechnicalIndex,
}: {
  library: DocsLibraryBuild;
  showFullTechnicalIndex: boolean;
}) {
  const categories = showFullTechnicalIndex
    ? library.fullCategories
    : library.publicCategories;
  const { stats } = library;

  return (
    <div className="min-h-dvh px-4 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Back to HUD" className="flex flex-wrap items-center justify-between gap-4">
          <RouteRow>
            <Link href="/" className={hudRouteLink}>
              ← HUD
            </Link>
          </RouteRow>
          {showFullTechnicalIndex ? (
            <Link
              href="/docs"
              className={`${mono} text-[11px] font-medium text-sky-400/90 hover:text-sky-300`}
            >
              Curated docs home
            </Link>
          ) : (
            <Link
              href="/docs?library=all"
              className={`${mono} text-[11px] font-medium text-zinc-500 hover:text-zinc-300`}
            >
              Complete index ({stats.totalFiles} files)
            </Link>
          )}
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
            Jarvis is a <strong className="font-medium text-zinc-200">control plane</strong> for
            governed AI: agents and tools can propose work;{" "}
            <strong className="font-medium text-zinc-200">people</strong> approve and execute.
            Outcomes ship with receipts and traces—so trust comes from proof, not from the model
            sounding confident.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
            This page is organized{" "}
            <strong className="font-medium text-zinc-400">by audience</strong> first (newcomers,
            investors, trust story, operators). The technical file index at the bottom defaults to
            a <strong className="font-medium text-zinc-400">curated list</strong>—good for diligence
            without internal research notes cluttering the view.
          </p>
        </header>

        <section
          aria-label="Shortcuts"
          className="mt-10 grid gap-8 border-b border-white/[0.06] pb-10 sm:grid-cols-2"
        >
          <div>
            <h2
              className={`${mono} mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500`}
            >
              Short paths
            </h2>
            <RouteRow>
              <RouteLink href="/library">/library</RouteLink>
              <RouteLink href="/pitch">/pitch</RouteLink>
              <RouteLink href="/playbook">/playbook</RouteLink>
              <RouteLink href="/thesis">/thesis</RouteLink>
            </RouteRow>
          </div>
          <div>
            <h2
              className={`${mono} mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500`}
            >
              In the app
            </h2>
            <RouteRow>
              <RouteLink href="/">HUD</RouteLink>
              <RouteLink href="/activity" accent="activity">
                Activity
              </RouteLink>
              <RouteLink href="/docs">Docs</RouteLink>
              <RouteLink href="/demo">Demo</RouteLink>
              <RouteLink href="/about">About</RouteLink>
            </RouteRow>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="newcomers-heading">
          <SectionTitle
            eyebrow="New here"
            sectionId="newcomers-heading"
            title="Start without the stack"
            subtitle="No install required to understand what Jarvis is and why it exists."
          />
          <CardGrid items={library.newcomers} />
        </section>

        <section className="mt-14" aria-labelledby="investors-heading">
          <SectionTitle
            eyebrow="Investors & narrative"
            sectionId="investors-heading"
            title="Materials for the room"
            subtitle="Pitch, positioning, and short proof scripts—written to stand alone."
          />
          <CardGrid items={library.investors} />
        </section>

        <section className="mt-14" aria-labelledby="trust-heading">
          <SectionTitle
            eyebrow="Trust & architecture"
            sectionId="trust-heading"
            title="Why this is safe to take seriously"
            subtitle="Governance rules and system maps you can share with technical advisors."
          />
          <CardGrid items={library.trust} />
        </section>

        <section className="mt-14" aria-labelledby="operators-heading">
          <SectionTitle
            eyebrow="Operators & builders"
            sectionId="operators-heading"
            title="Run it locally and wire integrations"
            subtitle="Checklists, blessed stack, and ingress protocol—once you are ready to touch terminals."
          />
          <CardGrid items={library.operators} />
        </section>

        <section className="mt-16" aria-labelledby="index-heading">
          <SectionTitle
            eyebrow={showFullTechnicalIndex ? "Complete index" : "Technical library"}
            sectionId="index-heading"
            title={
              showFullTechnicalIndex
                ? "All markdown files"
                : "Curated file browser"
            }
            subtitle={
              showFullTechnicalIndex
                ? "Everything under docs/, grouped by area. Titles come from each file’s first heading when present."
                : `Showing ${stats.listedInPublicIndex} of ${stats.totalFiles} files. ${stats.hiddenFromPublicIndex} internal or research drafts are hidden from this list but still available via direct links and the repo.`
            }
          />
          {!showFullTechnicalIndex && stats.hiddenFromPublicIndex > 0 ? (
            <p className={`${mono} mb-8 text-[11px] text-zinc-600`}>
              <Link href="/docs?library=all" className="text-sky-400/85 hover:text-sky-300">
                Browse all {stats.totalFiles} files including internal notes →
              </Link>
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            {categories.map((cat: DocsLibraryCategory) => (
              <div
                key={cat.id}
                className="flex flex-col rounded-2xl border border-white/[0.06] bg-black/25 p-6 sm:p-7"
              >
                <h3 className="text-lg font-medium tracking-tight text-zinc-100">
                  {cat.label}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                  {cat.description}
                </p>
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
