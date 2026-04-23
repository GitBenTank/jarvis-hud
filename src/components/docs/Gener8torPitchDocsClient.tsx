"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gener8torPitchSlideDeck } from "@/components/demo/Gener8torPitchSlideDeck";
import { DocsAmbient } from "@/components/docs/DocsAmbient";

/**
 * Full-viewport cinematic Gener8tor deck (same slides as /demo) from /docs.
 */
export function Gener8torPitchDocsClient() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#050508] text-zinc-100 [font-family:var(--font-demo-sans),system-ui,sans-serif]">
      <DocsAmbient />
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-[110] flex items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <nav
          className="pointer-events-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] font-medium text-zinc-500"
          aria-label="Pitch navigation"
        >
          <Link
            href="/docs"
            className="transition hover:text-zinc-200"
          >
            Docs
          </Link>
          <Link
            href="/docs/strategy/gener8tor-pitch?view=markdown"
            className="transition hover:text-zinc-200"
          >
            Markdown
          </Link>
        </nav>
      </header>
      <Gener8torPitchSlideDeck
        slideIdPrefix="docs-g8"
        ctaLabel="Continue to live demo"
        onCta={() => {
          router.push("/demo");
        }}
        footerHint="Opens /demo — transition + proof scroll"
      />
    </div>
  );
}
