import Link from "next/link";
import type { Components } from "react-markdown";
import { resolveDocsRelativeHref } from "@/lib/docs-content";

const mono =
  "[font-family:var(--font-docs-mono),ui-monospace,monospace]" as const;

export type DocsMarkdownVariant = "light" | "dark";

/** react-markdown map — default light (minimal docs); dark matches /demo zone */
export function getDocsMarkdownComponents(
  docSegments: string[],
  variant: DocsMarkdownVariant = "dark",
): Components {
  const isLight = variant === "light";

  const linkPrimary = isLight
    ? "font-medium text-[#0071e3] underline decoration-[#0071e3]/25 underline-offset-2 hover:decoration-[#0071e3]"
    : "font-medium text-sky-300/95 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-200";

  return {
    a: ({ href, children }) => {
      if (!href) return <span>{children}</span>;
      const to = resolveDocsRelativeHref(href, docSegments);
      if (to.startsWith("http") || to.startsWith("mailto:")) {
        return (
          <a
            href={to}
            target="_blank"
            rel="noopener noreferrer"
            className={linkPrimary}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={to} className={linkPrimary}>
          {children}
        </Link>
      );
    },
    h1: ({ children }) => (
      <h1
        className={
          isLight
            ? "mb-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-[2rem]"
            : "mb-6 text-3xl font-medium tracking-tight text-zinc-50 sm:text-4xl"
        }
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        className={
          isLight
            ? "mb-4 mt-14 border-b border-zinc-200/90 pb-2 text-xl font-semibold tracking-tight text-zinc-900 first:mt-0 sm:text-2xl"
            : "mb-4 mt-12 border-b border-white/[0.08] pb-2 text-xl font-medium tracking-tight text-zinc-100 first:mt-0 sm:text-2xl"
        }
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className={
          isLight
            ? "mb-3 mt-8 text-lg font-semibold text-zinc-800"
            : "mb-3 mt-8 text-lg font-medium text-zinc-200"
        }
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4
        className={
          isLight
            ? "mb-2 mt-6 text-base font-semibold text-zinc-800"
            : "mb-2 mt-6 text-base font-medium text-zinc-300"
        }
      >
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p
        className={
          isLight
            ? "mb-4 text-base leading-[1.6] text-zinc-600"
            : "mb-4 text-base leading-relaxed text-zinc-400"
        }
      >
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul
        className={
          isLight
            ? "mb-4 ml-4 list-disc space-y-2 text-zinc-600 marker:text-zinc-400"
            : "mb-4 ml-4 list-disc space-y-2 text-zinc-400 marker:text-sky-500/60"
        }
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={
          isLight
            ? "mb-4 ml-4 list-decimal space-y-2 text-zinc-600 marker:text-zinc-400"
            : "mb-4 ml-4 list-decimal space-y-2 text-zinc-400 marker:text-sky-500/60"
        }
      >
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote
        className={
          isLight
            ? "mb-4 border-l-2 border-zinc-300 pl-4 text-zinc-500"
            : "mb-4 border-l-2 border-sky-500/40 pl-4 text-zinc-500 italic"
        }
      >
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr
        className={isLight ? "my-10 border-zinc-200" : "my-10 border-white/[0.08]"}
      />
    ),
    strong: ({ children }) => (
      <strong
        className={
          isLight ? "font-semibold text-zinc-900" : "font-semibold text-zinc-200"
        }
      >
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className={isLight ? "text-zinc-700" : "text-zinc-300"}>{children}</em>
    ),
    code: ({ className, children }) => {
      const isBlock = Boolean(className?.includes("language-"));
      if (isBlock) {
        return (
          <code
            className={`${mono} block text-sm ${isLight ? "text-zinc-800" : "text-sky-100/90"}`}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className={`${mono} rounded-md px-1.5 py-0.5 text-[0.9em] ${
            isLight
              ? "bg-zinc-200/80 text-zinc-800"
              : "bg-white/[0.08] text-sky-200/95"
          }`}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre
        className={
          isLight
            ? "mb-6 overflow-x-auto rounded-xl border border-zinc-200/80 bg-white p-4 text-sm text-zinc-700 shadow-sm"
            : "mb-6 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/50 p-4 text-sm text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        }
      >
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div
        className={
          isLight
            ? "mb-6 overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-sm"
            : "mb-6 overflow-x-auto rounded-xl border border-white/[0.08]"
        }
      >
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead
        className={`${mono} border-b ${
          isLight
            ? "border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500"
            : "border-white/[0.08] bg-white/[0.04] text-[11px] uppercase tracking-wider text-zinc-400"
        }`}
      >
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className={isLight ? "text-zinc-600" : "text-zinc-400"}>
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr
        className={
          isLight
            ? "border-b border-zinc-100 last:border-0"
            : "border-b border-white/[0.05] last:border-0"
        }
      >
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th
        className={
          isLight
            ? "px-4 py-3 font-semibold text-zinc-800"
            : "px-4 py-3 font-semibold text-zinc-300"
        }
      >
        {children}
      </th>
    ),
    td: ({ children }) => <td className="px-4 py-3">{children}</td>,
  };
}
