import Link from "next/link";
import { InvestorReadPackTatiLayout } from "@/components/docs/InvestorReadPackTatiLayout";

const PACK: { href: string; title: string; blurb: string; plain: string }[] = [
  {
    href: "/docs/strategy/gener8tor-pitch",
    title: "1 · Gener8tor pitch",
    blurb: "Six-slide story + demo beats—stakes before the UI.",
    plain: "The script for what you say and show before they ask to see the product.",
  },
  {
    href: "/docs/strategy/room-playbook-v1",
    title: "2 · Room playbook",
    blurb: "Opener discipline, 30-second pitch, Q&A—what we don’t lead with.",
    plain: "How we stay clear and short so we don’t talk past the room.",
  },
  {
    href: "/docs/decisions/0001-thesis-lock",
    title: "3 · Thesis Lock (ADR)",
    blurb: "Propose vs approve vs execute; receipts; model isn’t the authority.",
    plain: "The constitution: humans own the yes; running work is explicit; everything leaves a trail.",
  },
  {
    href: "/docs/strategy/flagship-team-bundle-v1",
    title: "4 · Flagship team bundle",
    blurb: "Alfred, Research, Creative—roles, handoffs, sample flows.",
    plain: "Multiple agents as one system—not one magic assistant that does everything.",
  },
];

export default function InvestorReadPackPage() {
  return (
    <InvestorReadPackTatiLayout>
      <div>
        <p className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Tati · Investors and advisors
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
          Investor read pack
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          About <strong className="text-zinc-300">15 minutes</strong> in order. Same four every time.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          <strong className="font-medium text-zinc-400">Plain English:</strong> Agents can already act in the real
          world—the gap is <strong className="font-medium text-zinc-300">who approved it</strong>,{" "}
          <strong className="font-medium text-zinc-300">what ran</strong>, and{" "}
          <strong className="font-medium text-zinc-300">proof you can show later</strong>. Jarvis sits on that boundary.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          In the room: problem first, then{" "}
          <Link href="/demo" className="text-zinc-200 underline underline-offset-2 hover:text-white">
            /demo
          </Link>
          . Use these when they want depth.
        </p>

        <ol className="mt-10 space-y-8">
          {PACK.map((item) => (
            <li key={item.href} className="list-none">
              <Link
                href={item.href}
                className="block text-base font-medium text-zinc-100 underline-offset-2 hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-1.5 text-sm text-zinc-400">{item.blurb}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                <span className="text-zinc-600">In plain English: </span>
                {item.plain}
              </p>
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
    </InvestorReadPackTatiLayout>
  );
}
