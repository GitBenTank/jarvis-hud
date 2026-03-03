import path from "node:path";
import fs from "node:fs/promises";
import Link from "next/link";

const DOCS_ROOT = path.join(process.cwd(), "docs");

async function getDocContent(pathSegments: string[]): Promise<string | null> {
  if (pathSegments.length === 0) return null;
  const filePath = path.join(DOCS_ROOT, ...pathSegments);
  const withExt = filePath.endsWith(".md") ? filePath : `${filePath}.md`;
  try {
    const content = await fs.readFile(withExt, "utf-8");
    return content;
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
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
          >
            ← Back to HUD
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Research & Security Docs</h1>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                href="/docs/research/video-insights/insight-index"
                className="text-zinc-700 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                Video Insights Index
              </Link>
            </li>
            <li>
              <Link
                href="/docs/security/trusted-ingress"
                className="text-zinc-700 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                Trusted Ingress
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (!isAllowedPath(segments)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <p className="text-red-600">Invalid path</p>
          <Link href="/docs" className="mt-2 inline-block text-sm text-zinc-500 hover:underline">
            Back to docs
          </Link>
        </div>
      </div>
    );
  }

  const content = await getDocContent(segments);

  if (!content) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <p className="text-zinc-600 dark:text-zinc-400">Document not found</p>
          <Link href="/docs" className="mt-2 inline-block text-sm text-zinc-500 hover:underline">
            Back to docs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/docs"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
        >
          ← Back to docs
        </Link>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {content}
        </pre>
      </div>
    </div>
  );
}
