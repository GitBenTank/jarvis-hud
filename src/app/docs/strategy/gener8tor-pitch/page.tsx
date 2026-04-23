import path from "node:path";
import fs from "node:fs/promises";
import Link from "next/link";
import { DocsArticleClient } from "@/components/docs/DocsArticleClient";
import { Gener8torPitchDocsClient } from "@/components/docs/Gener8torPitchDocsClient";

export default async function Gener8torPitchPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;

  if (view === "markdown") {
    const filePath = path.join(
      process.cwd(),
      "docs/strategy/gener8tor-pitch.md",
    );
    const raw = await fs.readFile(filePath, "utf-8");

    return (
      <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
        <Link
          href="/docs/strategy/gener8tor-pitch"
          className="text-sm text-sky-400/90 underline hover:text-sky-300"
        >
          ← Slide deck
        </Link>
        <p
          className={`mt-10 font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Source
        </p>
        <div className="mt-4">
          <DocsArticleClient
            raw={raw}
            docSegments={["strategy", "gener8tor-pitch"]}
          />
        </div>
      </div>
    );
  }

  return <Gener8torPitchDocsClient />;
}
