import path from "node:path";
import fs from "node:fs/promises";
import Link from "next/link";
import { DocsArticleClient } from "@/components/docs/DocsArticleClient";
import { DocsLibraryIndex } from "@/components/docs/DocsLibraryIndex";

const DOCS_ROOT = path.join(process.cwd(), "docs");

async function getDocContent(pathSegments: string[]): Promise<string | null> {
  if (pathSegments.length === 0) return null;
  const filePath = path.join(DOCS_ROOT, ...pathSegments);
  const withExt = filePath.endsWith(".md") ? filePath : `${filePath}.md`;
  try {
    return await fs.readFile(withExt, "utf-8");
  } catch {
    return null;
  }
}

function isAllowedPath(segments: string[]): boolean {
  const requested = path.join(DOCS_ROOT, ...segments);
  const resolved = path.resolve(requested);
  return resolved.startsWith(DOCS_ROOT) && !segments.some((s) => s === "..");
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path: pathSegments } = await params;
  const segments = pathSegments ?? [];

  if (segments.length === 0) {
    return <DocsLibraryIndex />;
  }

  if (!isAllowedPath(segments)) {
    return (
      <div className="min-h-screen px-5 py-14 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-red-400">Invalid path</p>
          <Link
            href="/docs"
            className="mt-2 inline-block text-sm text-sky-400/90 underline hover:text-sky-300"
          >
            Back to docs
          </Link>
        </div>
      </div>
    );
  }

  const content = await getDocContent(segments);

  if (!content) {
    return (
      <div className="min-h-screen px-5 py-14 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-zinc-600">Document not found</p>
          <Link
            href="/docs"
            className="mt-2 inline-block text-[13px] font-medium text-[#0071e3] hover:underline"
          >
            Back to docs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-14 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/docs"
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← Docs library
        </Link>
        <p
          className={`mt-2 font-[family-name:var(--font-docs-mono)] text-[11px] text-zinc-500`}
        >
          /docs/{segments.join("/")}
        </p>
        <div className="mt-10">
          <DocsArticleClient raw={content} docSegments={segments} />
        </div>
      </div>
    </div>
  );
}
