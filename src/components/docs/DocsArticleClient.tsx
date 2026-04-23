"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDocsMarkdownComponents } from "@/lib/docs-markdown";
import type { DocsMarkdownVariant } from "@/lib/docs-markdown";
import { splitMarkdownIntoSlides, stripFrontmatter } from "@/lib/docs-content";

const mono =
  "[font-family:var(--font-docs-mono),ui-monospace,monospace]" as const;

function modeButtonClass(
  variant: DocsMarkdownVariant,
  active: boolean,
  disabled?: boolean,
): string {
  const base = `${mono} rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition`;
  if (disabled) {
    return variant === "light"
      ? `${base} cursor-not-allowed border border-zinc-200 bg-zinc-100/80 text-zinc-400`
      : `${base} cursor-not-allowed border border-white/[0.06] bg-white/[0.02] text-zinc-600`;
  }
  if (variant === "light") {
    if (active) {
      return `${base} border border-zinc-900 bg-zinc-900 text-white`;
    }
    return `${base} border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-zinc-300 hover:text-zinc-900`;
  }
  if (active) {
    return `${base} border border-sky-500/45 bg-sky-500/12 text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.12)]`;
  }
  return `${base} border border-white/[0.1] bg-black/30 text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200`;
}

export function DocsArticleClient({
  raw,
  docSegments,
  variant = "dark",
}: {
  raw: string;
  docSegments: string[];
  variant?: DocsMarkdownVariant;
}) {
  const [mode, setMode] = useState<"read" | "slides">("read");
  const slides = useMemo(() => splitMarkdownIntoSlides(raw), [raw]);
  const canSlides = slides.length >= 2;
  const components = useMemo(
    () => getDocsMarkdownComponents(docSegments, variant),
    [docSegments, variant],
  );
  const body = stripFrontmatter(raw);

  const muted = variant === "light" ? "text-zinc-500" : "text-zinc-500";
  const footerLink =
    variant === "light"
      ? "text-[#0071e3] underline decoration-[#0071e3]/25 underline-offset-2 hover:decoration-[#0071e3]"
      : "text-sky-400/80 underline decoration-sky-500/30 underline-offset-2 hover:text-sky-300";

  const slideShell =
    variant === "light"
      ? "rounded-2xl border border-zinc-200/80 bg-white shadow-sm"
      : "rounded-xl border border-white/[0.06] bg-black/20";

  return (
    <>
      <div
        className={
          variant === "light"
            ? "mb-8 flex flex-col gap-4 border-b border-zinc-200/90 pb-6 sm:flex-row sm:items-center sm:justify-between"
            : "mb-8 flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("read")}
            className={modeButtonClass(variant, mode === "read")}
          >
            Read
          </button>
          <button
            type="button"
            disabled={!canSlides}
            onClick={() => setMode("slides")}
            className={modeButtonClass(variant, mode === "slides", !canSlides)}
          >
            Slides
          </button>
        </div>
        <p className={`${mono} text-[10px] ${muted}`}>
          {canSlides
            ? `${slides.length} sections · split on ## headings`
            : "One section — add ## headings for slide mode"}
        </p>
      </div>

      {mode === "read" ? (
        <article className="pb-28">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {body}
          </ReactMarkdown>
        </article>
      ) : (
        <div
          className={`h-[calc(100dvh-14rem)] snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] ${slideShell}`}
        >
          {slides.map((slide, i) => (
            <section
              key={i}
              className="flex min-h-[calc(100dvh-14rem)] snap-start snap-always flex-col justify-center px-5 py-12 sm:px-10"
            >
              <div className="mx-auto w-full max-w-3xl">
                <p
                  className={`${mono} mb-8 text-[10px] font-semibold uppercase tracking-[0.22em] ${muted}`}
                >
                  Slide {i + 1} / {slides.length}
                </p>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={components}
                >
                  {slide}
                </ReactMarkdown>
              </div>
            </section>
          ))}
        </div>
      )}

      <p className={`${mono} mt-10 text-center text-[10px] ${variant === "light" ? "text-zinc-400" : "text-zinc-600"}`}>
        <Link href="/docs" className={footerLink}>
          Docs library
        </Link>
        {" · "}
        <Link href="/demo" className={footerLink}>
          Investor demo
        </Link>
        {" · "}
        <Link href="/" className={footerLink}>
          HUD
        </Link>
      </p>
    </>
  );
}
