import Link from "next/link";

const PACK: { href: string; title: string; blurb: string }[] = [
  {
    href: "/docs/strategy/gener8tor-pitch",
    title: "Gener8tor pitch",
    blurb: "Overview + demo framing (consequence before chrome).",
  },
  {
    href: "/docs/strategy/room-playbook-v1",
    title: "Room playbook",
    blurb: "How we approach conversations—restraint signal.",
  },
  {
    href: "/docs/decisions/0001-thesis-lock",
    title: "Thesis Lock (ADR)",
    blurb: "Core rule of the system—single source of truth.",
  },
  {
    href: "/docs/strategy/flagship-team-bundle-v1",
    title: "Flagship team bundle",
    blurb: "Agent layer as a system—not one agent.",
  },
];

export default function InvestorReadPackPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-xl px-5 py-14 sm:px-8">
        <p className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Investor read pack
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
          Canonical four
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          About <strong className="text-zinc-300">15 minutes</strong> if you read in order. Same links every time—we don’t rotate this list per
          meeting.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          In the room: start with the problem and <Link href="/demo" className="text-sky-400/90 underline hover:text-sky-300">/demo</Link>
          ; open these when asked.
        </p>

        <ol className="mt-10 space-y-8">
          {PACK.map((item, i) => (
            <li key={item.href} className="list-none">
              <span className="font-[family-name:var(--font-docs-mono)] text-xs text-zinc-500">{i + 1}.</span>
              <Link
                href={item.href}
                className="mt-1 block text-base font-medium text-sky-400/95 underline-offset-2 hover:text-sky-300 hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-1.5 text-sm text-zinc-400">{item.blurb}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 border-t border-zinc-800 pt-8">
          <Link
            href="/docs/strategy/investor-read-pack"
            className="text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            Full markdown page (repo + print)
          </Link>
          <span className="mx-2 text-zinc-600">·</span>
          <Link href="/docs" className="text-sm text-zinc-500 underline hover:text-zinc-300">
            All docs
          </Link>
        </div>
      </div>
    </div>
  );
}
