import Link from "next/link";
import { InvestorReadPackTatiLayout } from "@/components/docs/InvestorReadPackTatiLayout";

/** Ordered for live demo + rehearsal — one scroll, minimal thinking. */
const TOMORROW_ANCHOR: string[] = [
  "Open demo",
  "Run narrative",
  "Show proof (email / execution)",
  "Handle Q&A",
  "Close with DevHouse + CTRL+STRUM",
];

const TOMORROW_FLOW: { href: string; title: string; blurb: string; plain: string }[] = [
  {
    href: "/docs/strategy/investor-demo-narrative-script",
    title: "1 · Demo narrative (what you say)",
    blurb: "Spoken weave: hero → forces → consequence → gap → HUD — keep in sync with /demo.",
    plain: "The full script while you rehearse—not the four slide-only links below.",
  },
  {
    href: "/docs/strategy/investor-live-proof-map",
    title: "2 · Live proof map (what you show)",
    blurb: "Trigger → line → pixel + burn lines for pushback.",
    plain: "~5 minute glance before doors: approvals, receipts, traces.",
  },
  {
    href: "/docs/video/investor-demo-full-runbook",
    title: "3 · Full runbook (how you execute)",
    blurb: "Boot, stack, Flow 1, OpenClaw, camera, fallbacks.",
    plain: "Operator truth for the mechanical path.",
  },
  {
    href: "/docs/video/investor-demo-rehearsal-run-sheet",
    title: "4 · Rehearsal sheet (timing / beats)",
    blurb: "One page: surfaces, rhythms, rejects vs approves.",
    plain: "Flow control during the dress rehearsal—not first email copy.",
  },
  {
    href: "/docs/interview-prep-jarvis",
    title: "5 · Interview prep (Q&A safety net)",
    blurb: "Walk-through + runtime bypass / packaging — room answers.",
    plain: "If they grill you after the demo—not for the cinematic opener.",
  },
];

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
    title: "4 · Teams: proposals → approvals → proof",
    blurb:
      "How real teams hand work across roles without blurring authority—canonical flagship bundle.",
    plain:
      "How teams actually use this: proposals, approvals, and recorded outcomes—open when they ask what the “agent team” is.",
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
          <strong className="font-medium text-zinc-300">Why this matters in one line:</strong> most
          systems log what happened—Jarvis proves who decided, who executed, and what actually
          occurred.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          About <strong className="text-zinc-300">15 minutes</strong> in order. Same four every time — plus{" "}
          <strong className="text-zinc-300">tomorrow’s rehearsal stack</strong> below.
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

        <section
          aria-labelledby="tomorrow-flow-heading"
          className="mt-10 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-5 sm:px-5"
        >
          <p
            id="tomorrow-flow-heading"
            className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90"
          >
            Tomorrow&apos;s flow
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Mental anchor — run order. Then open the links below top to bottom.
          </p>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-zinc-200 marker:text-emerald-500/80">
            {TOMORROW_ANCHOR.map((step) => (
              <li key={step} className="pl-1">
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-8 space-y-8">
            {TOMORROW_FLOW.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block text-base font-medium text-emerald-200/95 underline-offset-2 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1.5 text-sm text-zinc-400">{item.blurb}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  <span className="text-zinc-600">In plain English: </span>
                  {item.plain}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 border-t border-zinc-800 pt-10">
          <p className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Understand the control plane in ~15 minutes (canonical four)
          </p>
          <p className="mt-2 text-xs text-zinc-500">Same four every time—the depth path after slides.</p>
        </div>

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
