"use client";

import Link from "next/link";
import { Frame } from "@/components/demo/Frame";
import { ProductMock } from "@/components/demo/ProductMock";
import { Reveal } from "@/components/demo/Reveal";
import { Title } from "@/components/demo/Title";

const demoMono =
  "[font-family:var(--font-demo-mono),ui-monospace,monospace]" as const;

const LIFECYCLE = [
  { label: "PROPOSE", line: "Explicit action submitted" },
  { label: "APPROVE", line: "Human authorization gate" },
  { label: "EXECUTE", line: "Separate from approval" },
  { label: "RECEIPT", line: "Artifact + outcome" },
  { label: "TRACE", line: "End-to-end reconstruction" },
] as const;

/**
 * Proof section: lifecycle, mock, link to HUD, outbound proof beat, close.
 * Opens after investor slides + transition (see DemoExperience).
 */
export function DemoCinematicScroll() {
  return (
    <>
      {/* Bridge — same spine in the product */}
      <Frame className="z-10">
        <Reveal>
          <p
            className={`${demoMono} mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
          >
            Live system
          </p>
          <Title className="!max-w-3xl">
            Approval and proof — not the same step
          </Title>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-400 md:text-lg">
            A system that separates approval from execution — and produces
            proof of what actually happened.
          </p>
        </Reveal>
        <Reveal delayMs={200}>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg font-medium text-zinc-100 md:text-xl">
            That&apos;s what Jarvis does.
          </p>
        </Reveal>
        <Reveal delayMs={280}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-zinc-300 md:text-lg">
            Jarvis doesn&apos;t manage agents — it{" "}
            <span className="text-sky-200/90">governs execution</span>.
            That&apos;s where authority lives.
          </p>
        </Reveal>
        <div className="mt-12 grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LIFECYCLE.map((step, i) => (
            <Reveal key={step.label} delayMs={360 + i * 60}>
              <div className="flex h-full flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-5">
                <span
                  className={`${demoMono} text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400/90`}
                >
                  {step.label}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {step.line}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Frame>

      {/* Demo handoff */}
      <Frame className="z-10">
        <Reveal>
          <Title className="!text-3xl sm:!text-4xl md:!text-5xl">
            propose → approve → execute → receipt → trace
          </Title>
        </Reveal>
        <Reveal delayMs={120}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-zinc-400 md:text-lg">
            The same local system — proposal from{" "}
            <span className="text-sky-200/90">OpenClaw</span>, governed and
            executed in <span className="text-sky-200/90">Jarvis</span>.
          </p>
        </Reveal>
        <Reveal delayMs={220}>
          <p className="mx-auto mt-6 max-w-xl text-center text-sm text-zinc-500 md:text-base">
            Most stacks give you logs. Jarvis gives you proof.
          </p>
        </Reveal>
      </Frame>

      {/* Product — governed action + console mock */}
      <Frame className="z-10">
        <Reveal>
          <Title>A governed action</Title>
        </Reveal>
        <ul className="mx-auto mt-10 max-w-xl space-y-4 text-center text-base text-zinc-300 md:text-lg">
          {[
            "The agent proposes the action.",
            "A human explicitly approves it.",
            "Execution happens as a separate step.",
            "We get a receipt and a trace tied to that action.",
          ].map((line, i) => (
            <li key={line}>
              <Reveal delayMs={i * 80}>
                <span>{line}</span>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal delayMs={380}>
          <p className="mx-auto mt-12 text-center text-base font-medium text-zinc-200 md:text-lg">
            Not logs — <span className="text-sky-200/90">proof</span>.
          </p>
        </Reveal>
        <Reveal delayMs={460}>
          <ProductMock />
        </Reveal>
      </Frame>

      {/* Hard cut → live HUD */}
      <Frame className="z-10">
        <Reveal>
          <Title>Same lifecycle in the live system</Title>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-400 md:text-lg">
            Every step explicit. Every action attributable. Walk proposal →
            approval → execute → receipt in the HUD.
          </p>
        </Reveal>
        <Reveal delayMs={200}>
          <p className="mt-10 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/10 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/15"
            >
              Open Jarvis HUD
            </Link>
          </p>
        </Reveal>
      </Frame>

      {/* Gmail proof moment */}
      <Frame className="z-10">
        <Reveal>
          <Title>Real outbound proof</Title>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-zinc-300 md:text-lg">
            A real outbound action — generated by the agent — that only exists
            because it was approved and executed through Jarvis.
          </p>
        </Reveal>
        <Reveal delayMs={200}>
          <p
            className={`${demoMono} mx-auto mt-10 text-center text-[11px] uppercase tracking-[0.14em] text-zinc-500`}
          >
            Show the inbox · then return to HUD for the close
          </p>
        </Reveal>
      </Frame>

      {/* Final close — three beats */}
      <Frame className="z-10 pb-28">
        <Reveal>
          <div className="mx-auto max-w-2xl space-y-8 text-center text-2xl font-medium leading-snug tracking-tight text-zinc-100 sm:text-3xl md:text-[2rem] md:leading-tight">
            <p>The agent generated the action.</p>
            <p>Jarvis governed the execution.</p>
            <p className="text-sky-200/95">And now we have proof.</p>
          </div>
        </Reveal>
      </Frame>
    </>
  );
}
