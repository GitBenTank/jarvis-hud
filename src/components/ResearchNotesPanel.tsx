"use client";

import Link from "next/link";

export default function ResearchNotesPanel() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Research notes
      </h3>
      <ul className="space-y-1 text-xs">
        <li>
          <Link
            href="/docs"
            className="text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Docs library (pitch, thesis, setup)
          </Link>
        </li>
        <li>
          <Link
            href="/docs/research/video-insights/insight-index"
            className="text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Video insights index
          </Link>
        </li>
        <li>
          <Link
            href="/docs/security/trusted-ingress"
            className="text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Trusted ingress
          </Link>
        </li>
      </ul>
    </div>
  );
}
