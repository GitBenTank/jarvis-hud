import Link from "next/link";
import { InvestorReadPackTatiLayout } from "@/components/docs/InvestorReadPackTatiLayout";

/** Optional depth after the canonical four — runbooks and narration live under docs/video/. */
const WALKTHROUGH_LINKS: { href: string; title: string; blurb: string; plain: string }[] = [
  {
    href: "/docs/video/README",
    title: "Walkthroughs & recording artifacts (index)",
    blurb: "Runbooks, one-page operator order, short recording specs.",
    plain: "Single entry point for everything under docs/video/.",
  },
  {
    href: "/docs/strategy/investor-demo-narrative-script",
    title: "Narration aligned to /demo",
    blurb: "Spoken blocks keyed to slides and handoff—kept in sync with investorDemoSpeakerNotes.ts.",
    plain: "Use when you need spoken copy beside the in-app deck.",
  },
  {
    href: "/docs/video/investor-demo-full-runbook",
    title: "Full operator runbook",
    blurb: "Boot, stack, flows, OpenClaw, checklists.",
    plain: "Mechanical truth for a complete walkthrough.",
  },
  {
    href: "/docs/video/investor-demo-rehearsal-run-sheet",
    title: "One-page operator sheet",
    blurb: "Surfaces, rhythm, approve vs reject, fallbacks.",
    plain: "Checklist form while driving the HUD.",
  },
  {
    href: "/docs/interview-prep-jarvis",
    title: "Diligence Q&A",
    blurb: "Runtime bypass, packaging, risk tiers—technical pushback.",
    plain: "Depth after architecture questions—not a substitute for the four core links.",
  },
];

const PACK: { href: string; title: string; blurb: string; plain: string }[] = [
  {
    href: "/docs/strategy/gener8tor-pitch",
    title: "1 · Gener8tor pitch",
    blurb: "Six-slide story + demo beats—stakes before deep UI.",
    plain: "Framing aligned to /demo before stakeholders ask to open the queue.",
  },
  {
    href: "/docs/strategy/room-playbook-v1",
    title: "2 · Room playbook",
    blurb: "Opener discipline, short pitch, Q&A boundaries.",
    plain: "Keep the story tight under time pressure.",
  },
  {
    href: "/docs/decisions/0001-thesis-lock",
    title: "3 · Thesis Lock (ADR)",
    blurb: "Propose vs approve vs execute; receipts; model isn’t the authority.",
    plain: "The constitution: humans own approval; execution is explicit; audit trail is mandatory.",
  },
  {
    href: "/docs/strategy/flagship-team-bundle-v1",
    title: "4 · Teams operate with Jarvis",
    blurb:
      "Proposals → approvals → attributable outcomes—canonical flagship bundle (operations, not slideshow).",
    plain:
      "How teams actually operate: proposals, approvals, recorded outcomes—open when they ask what the agent team is.",
  },
];

export default function InvestorReadPackPage() {
  return (
    <InvestorReadPackTatiLayout>
      <div>
        <p className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Executive briefing
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
          Control plane — plain English
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Minimal HUD layout for the executive briefing pack—the same four links as the markdown page.
          Stable URL alias:{" "}
          <Link href="/docs/briefing" className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline">
            /docs/briefing
          </Link>{" "}
          (identical content).
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          As agents begin to take real actions—sending emails, modifying code, triggering APIs—the boundary
          between <strong className="font-medium text-zinc-300">decision</strong> and{" "}
          <strong className="font-medium text-zinc-300">execution</strong> becomes the failure point.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          <strong className="font-medium text-zinc-300">Summary:</strong> most systems log what happened—Jarvis
          records who decided, who executed, and what occurred—
          <strong className="font-medium text-zinc-300"> at the boundary where failures happen</strong>.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          About <strong className="text-zinc-300">15 minutes</strong> in the order below. Optional walkthrough
          links follow the canonical four.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          <strong className="font-medium text-zinc-400">Product:</strong> Agents can already act on production
          rails—the control question is <strong className="font-medium text-zinc-300">who approved it</strong>,{" "}
          <strong className="font-medium text-zinc-300">what ran</strong>, and{" "}
          <strong className="font-medium text-zinc-300">what is provable afterward</strong>. Jarvis sits on that
          boundary.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          Lead with the problem, then{" "}
          <Link href="/demo" className="text-zinc-200 underline underline-offset-2 hover:text-white">
            /demo
          </Link>
          . Open depth when stakeholders ask for it.
        </p>

        <section
          aria-labelledby="walkthrough-depth-heading"
          className="mt-10 rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-4 py-5 sm:px-5"
        >
          <p
            id="walkthrough-depth-heading"
            className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500"
          >
            Optional — walkthrough & diligence depth
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Not part of the first fifteen minutes unless you are driving a live session or recording.
          </p>
          <div className="mt-8 space-y-8">
            {WALKTHROUGH_LINKS.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block text-base font-medium text-zinc-100 underline-offset-2 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1.5 text-sm text-zinc-400">{item.blurb}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  <span className="text-zinc-600">Context: </span>
                  {item.plain}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 border-t border-zinc-800 pt-10">
          <p className="font-[family-name:var(--font-docs-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Canonical four (~15 minutes)
          </p>
          <p className="mt-2 text-xs text-zinc-500">Fixed order—the default depth path.</p>
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
                <span className="text-zinc-600">Plain English: </span>
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
            Full markdown (print / repo)
          </Link>
          <span className="mx-2 text-zinc-600">·</span>
          <Link href="/docs" className="text-sm text-zinc-500 underline hover:text-zinc-300">
            Documentation home
          </Link>
        </div>
      </div>
    </InvestorReadPackTatiLayout>
  );
}
