"use client";

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
      <Reveal delayMs={280}>
        <div className="relative mt-6 border border-dashed border-violet-400/25 bg-violet-500/[0.06] px-5 py-6 text-center">
          <p
            className={`${demoMono} text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/80`}
          >
            Missing today
          </p>
          <p className="mt-2 text-base font-medium text-zinc-200">
            Execution authority layer
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            What runs — under whose sign-off — with proof
          </p>
        </div>
      </Reveal>
    </div>
  );
}

export function DemoExperience() {
  return (
    <div className="relative h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#050508] text-zinc-100 [scrollbar-gutter:stable]">
      <Ambient />

      {/* Hero */}
      <Frame className="z-10">
        <Reveal>
          <Title as="h1">Jarvis</Title>
        </Reveal>
        <Reveal delayMs={90}>
          <Subtitle className="mx-auto max-w-lg text-zinc-400">
            The control plane for AI execution
          </Subtitle>
        </Reveal>
        <Reveal delayMs={160}>
          <PillRow />
        </Reveal>
      </Frame>

      {/* Shift */}
      <Frame className="z-10">
        <Reveal>
          <Title>Agents are moving from generation to action</Title>
        </Reveal>
        <ul className="mt-12 space-y-4 text-center text-lg text-zinc-300 md:text-xl">
          {["Sending emails", "Modifying systems", "Triggering workflows"].map(
            (t, i) => (
              <li key={t}>
                <Reveal delayMs={i * 100}>
                  <span>{t}</span>
                </Reveal>
              </li>
            ),
          )}
        </ul>
        <Reveal delayMs={380}>
          <p className="mx-auto mt-14 max-w-xl text-center text-base font-medium leading-relaxed text-zinc-200 md:text-lg">
            What matters is not what it said —{" "}
            <span className="text-sky-300/90">it’s what it did</span>
          </p>
        </Reveal>
      </Frame>

      {/* Problem */}
      <Frame className="z-10">
        <Reveal>
          <Title>Execution is not controlled</Title>
        </Reveal>
        <div className="mt-14 grid w-full max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              t: "No explicit authorization",
              d: "Side effects can run before a human deliberately allows them.",
            },
            {
              t: "Approval ≠ execution",
              d: "Signing off and running the action collapse into one ambiguous step.",
            },
            {
              t: "Logs ≠ proof",
              d: "Activity records aren’t the same as who authorized what, when.",
            },
          ].map((col, i) => (
            <Reveal key={col.t} delayMs={i * 90}>
              <div className="h-full rounded-2xl bg-rose-950/[0.12] px-6 py-8 ring-1 ring-rose-500/15">
                <h3 className="text-lg font-medium text-rose-100/95">{col.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  {col.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Frame>

      {/* Market */}
      <Frame className="z-10">
        <Reveal>
          <Title>Enterprises are building the stack</Title>
        </Reveal>
        <Subtitle className="mx-auto mt-2 max-w-lg">
          Agents, platforms, governance — without a dedicated execution layer.
        </Subtitle>
        <MarketStack />
      </Frame>

      {/* Gap */}
      <Frame className="z-10">
        <Reveal>
          <Title>Visibility is not control</Title>
        </Reveal>
        <Reveal delayMs={120}>
          <div className="mt-16 flex flex-col items-center">
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
            <Reveal delayMs={200}>
              <p className="mt-10 max-w-lg text-center text-base leading-relaxed text-zinc-400 md:text-lg">
                Who approved this? Under what authority? Where is the proof?
              </p>
            </Reveal>
          </div>
        </Reveal>
      </Frame>

      {/* Jarvis */}
      <Frame className="z-10">
        <Reveal>
          <Title>Jarvis governs execution</Title>
        </Reveal>
        <Subtitle className="mx-auto mt-2 max-w-xl">
          Propose → approve → execute → receipt → trace
        </Subtitle>
        <div className="mt-12 grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LIFECYCLE.map((step, i) => (
            <Reveal key={step.label} delayMs={i * 70}>
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

      {/* Product */}
      <Frame className="z-10">
        <Reveal>
          <Title>Proof in the console</Title>
        </Reveal>
        <Subtitle className="mx-auto mt-2 max-w-xl">
          Queue, authorization, and reconstructable traces — one surface.
        </Subtitle>
        <Reveal delayMs={100}>
          <ProductMock />
        </Reveal>
      </Frame>

      {/* Why now */}
      <Frame className="z-10">
        <Reveal>
          <Title>Three forces at once</Title>
        </Reveal>
        <ul className="mt-12 max-w-xl space-y-6 text-center text-lg text-zinc-300 md:text-xl">
          {[
            { h: "Capability", b: "Tool-using agents are productized." },
            { h: "Adoption", b: "Production systems and real credentials." },
            { h: "Governance", b: "Accountability expectations, not vibes." },
          ].map((item, i) => (
            <li key={item.h}>
              <Reveal delayMs={i * 100}>
                <span className="font-medium text-zinc-100">{item.h}</span>
                <span className="text-zinc-500"> — {item.b}</span>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal delayMs={350}>
          <p className="mx-auto mt-14 max-w-lg text-center text-base font-medium text-sky-200/90 md:text-lg">
            The missing layer is execution control
          </p>
        </Reveal>
      </Frame>

      {/* Why this wins */}
      <Frame className="z-10">
        <Reveal>
          <Title>The control plane for action</Title>
        </Reveal>
        <ul className="mt-12 max-w-xl space-y-5 text-center text-lg text-zinc-300 md:text-xl">
          {[
            "Agent-agnostic — works across frameworks and connectors",
            "Authority boundaries — who may cause what",
            "Proof, not logs — receipts and traces you can stand behind",
          ].map((line, i) => (
            <li key={line}>
              <Reveal delayMs={i * 90}>
                <span>{line}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </Frame>

      {/* Closing */}
      <Frame className="z-10 pb-28">
        <Reveal>
          <Title>Every AI action will be governed</Title>
        </Reveal>
        <Reveal delayMs={120}>
          <p className="mt-8 text-center text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">
            Control · Audit · Trust
          </p>
        </Reveal>
      </Frame>
    </div>
  );
}
