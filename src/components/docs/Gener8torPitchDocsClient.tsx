"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gener8torPitchSlideDeck } from "@/components/demo/Gener8torPitchSlideDeck";
import { DocsAmbient } from "@/components/docs/DocsAmbient";

/**
 * Full-viewport cinematic Gener8tor deck (same slides as /demo) from /docs.
 * CTA opens Jarvis HUD home (/); handoff copy points to /demo for split notes.
 */
export function Gener8torPitchDocsClient() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#09090b] text-zinc-100 [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif]">
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
        ctaLabel="Open Jarvis HUD"
        onCta={() => {
          router.push("/");
        }}
        footerHint="Opens HUD home (/) — live path from there; full deck + split notes: /demo"
        handoffSurfaceNote={
          <>
            Open{" "}
            <Link
              href="/"
              className="font-medium text-zinc-400 underline decoration-zinc-600 underline-offset-2 transition hover:text-zinc-200"
            >
              Jarvis HUD
            </Link>{" "}
            (home) to run the live investor path—open OpenClaw from the UI, then queue in{" "}
            <Link
              href="/activity"
              className="font-medium text-zinc-400 underline decoration-zinc-600 underline-offset-2 transition hover:text-zinc-200"
            >
              Activity
            </Link>
            . For
            the six-slide story with{" "}
            <span className="text-zinc-400">split speaker notes</span> beside the deck, use{" "}
            <Link
              href="/demo"
              className="font-medium text-zinc-400 underline decoration-zinc-600 underline-offset-2 transition hover:text-zinc-200"
            >
              /demo
            </Link>
            .
          </>
        }
      />
    </div>
  );
}
