"use client";

import Link from "next/link";
import { Frame } from "@/components/demo/Frame";
import { PillRow } from "@/components/demo/PillRow";
import { ProductMock } from "@/components/demo/ProductMock";
import { Reveal } from "@/components/demo/Reveal";
import { Subtitle } from "@/components/demo/Subtitle";
import { Title } from "@/components/demo/Title";
import { cn } from "@/components/demo/cn";

const demoMono =
  "[font-family:var(--font-demo-mono),ui-monospace,monospace]" as const;

const LIFECYCLE = [
  { label: "PROPOSE", line: "Explicit action submitted" },
  { label: "APPROVE", line: "Human authorization gate" },
  { label: "EXECUTE", line: "Separate from approval" },
  { label: "RECEIPT", line: "Artifact + outcome" },
  { label: "TRACE", line: "End-to-end reconstruction" },
] as const;

function Ambient() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-18%,rgba(59,130,246,0.11),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_100%_60%,rgba(139,92,246,0.08),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-zinc-950/0 via-transparent to-zinc-950/90"
        aria-hidden
      />
    </>
  );
}

/** Infrastructure only — gap / void comes in the next section (woven script). */
function MarketStack() {
  return (
    <div className="mt-14 flex w-full max-w-md flex-col gap-0">
      {[
        { label: "Agents", sub: "Capabilities & tools" },
        { label: "Platforms", sub: "Catalogs & orchestration" },
        { label: "Governance", sub: "Policy & visibility" },
      ].map((row, i) => (
        <Reveal key={row.label} delayMs={i * 80}>
          <div className="border-t border-white/[0.08] py-5 first:border-t-0">
            <p className="text-lg font-medium text-zinc-200">{row.label}</p>
            <p className="mt-1 text-sm text-zinc-500">{row.sub}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function DemoExperience() {
  return (
    <div className="relative h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#050508] text-zinc-100 [scrollbar-gutter:stable]">
      <Ambient />

      {/* Open — hero */}
      <Frame className="z-10">
        <Reveal>
          <Title as="h1">Jarvis</Title>
        </Reveal>
        <Reveal delayMs={90}>
          <Subtitle className="mx-auto max-w-lg text-zinc-400">
            The control plane for AI execution
          </Subtitle>
        </Reveal>
        <Reveal delayMs={140}>
          <p
            className={`${demoMono} mt-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
          >
            Running live · local stack
          </p>
        </Reveal>
        <Reveal delayMs={180}>
          <PillRow />
        </Reveal>
      </Frame>

      {/* Scroll — three forces + live boundary */}
      <Frame className="z-10">
        <Reveal>
          <p className="mx-auto mb-6 max-w-2xl text-center text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
            Three forces
          </p>
          <Title className="!max-w-3xl">
            Agents can take real-world actions
          </Title>
        </Reveal>
        <ul className="mt-10 space-y-3 text-center text-lg text-zinc-300 md:text-xl">
          {[
            "Sending emails",
            "Modifying systems",
            "Triggering workflows",
          ].map((t, i) => (
            <li key={t}>
              <Reveal delayMs={i * 90}>
                <span>{t}</span>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal delayMs={320}>
          <p className="mx-auto mt-12 max-w-xl text-center text-base leading-relaxed text-zinc-300 md:text-lg">
            And what you&apos;re about to see is{" "}
            <span className="text-zinc-100">running live</span>.
          </p>
        </Reveal>
        <Reveal delayMs={400}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-400 md:text-lg">
            <span className="text-sky-200/90">OpenClaw</span> generates the
            proposal locally and sends it through the Jarvis ingress path.{" "}
            <span className="text-sky-200/90">Jarvis</span> holds it at the
            approval boundary before anything executes.
          </p>
        </Reveal>
      </Frame>

      {/* Infrastructure context */}
      <Frame className="z-10">
        <Reveal>
          <Title className="!max-w-3xl">
            Enterprises are building the stack
          </Title>
        </Reveal>
        <Subtitle className="mx-auto mt-3 max-w-xl">
          Registries, catalogs, governance layers — visibility: what exists,
          who owns it, what can be reused.
        </Subtitle>
        <MarketStack />
      </Frame>

      {/* Gap — slow down */}
      <Frame className="z-10">
        <Reveal>
          <Title className="!max-w-3xl">
            They don&apos;t control the moment of execution
          </Title>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-400 md:text-lg">
            Even when governance looks present — the control isn&apos;t at
            execution.
          </p>
        </Reveal>
        <Reveal delayMs={180}>
          <div className="mt-14 flex flex-col items-center">
            <div
              className={cn(
                "relative px-10 py-8 text-center sm:px-14 sm:py-10",
                "rounded-2xl bg-black/40 ring-1 ring-white/[0.06]",
              )}
            >
              <p
                className={cn(
                  `${demoMono} text-xl font-semibold uppercase tracking-[0.35em] text-zinc-100 sm:text-2xl`,
                  "drop-shadow-[0_0_28px_rgba(56,189,248,0.35)]",
                )}
                style={{ textShadow: "0 0 40px rgba(56, 189, 248, 0.25)" }}
              >
                EXECUTION VOID
              </p>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl bg-sky-500/[0.04] blur-xl"
                aria-hidden
              />
            </div>
            <p className="mt-10 max-w-lg text-center text-base leading-relaxed text-zinc-400 md:text-lg">
              Who approved this? Under what authority? Where is the proof?
            </p>
          </div>
        </Reveal>
        <Reveal delayMs={320}>
          <p
            className={`mx-auto mt-14 max-w-xl text-center text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl`}
          >
            That&apos;s the gap.
          </p>
        </Reveal>
        <Reveal delayMs={420}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-zinc-400 md:text-lg">
            As soon as those agents operate in real systems, the risks become{" "}
            <span className="text-zinc-200">real</span>
            — especially when actions aren&apos;t{" "}
            <span className="text-sky-200/90">independently verified</span>.
          </p>
        </Reveal>
        <Reveal delayMs={520}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-400 md:text-lg">
            Organizations are moving toward formal governance for AI in
            production.
          </p>
        </Reveal>
        <Reveal delayMs={620}>
          <p className="mx-auto mt-6 max-w-xl text-center text-lg font-medium text-zinc-200 md:text-xl">
            What&apos;s missing is control at the moment of execution.
          </p>
        </Reveal>
      </Frame>

      {/* Jarvis — lock-in */}
      <Frame className="z-10">
        <Reveal>
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
    </div>
  );
}
