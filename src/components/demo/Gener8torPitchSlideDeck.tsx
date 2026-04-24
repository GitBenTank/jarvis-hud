"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { Title } from "@/components/demo/Title";
import { Subtitle } from "@/components/demo/Subtitle";
import { cn } from "@/components/demo/cn";

const demoMono =
  "[font-family:var(--font-demo-mono),ui-monospace,monospace]" as const;

function DeckSlide({
  scrollRoot,
  id,
  ariaLabel,
  className,
  children,
}: {
  scrollRoot: HTMLElement | null;
  id: string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setRevealed(true);
      },
      { root: scrollRoot ?? undefined, threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollRoot]);

  return (
    <section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-4xl flex-col items-center",
          "demo-pitch-reveal",
          revealed && "demo-pitch-reveal-visible",
        )}
      >
        {children}
      </div>
    </section>
  );
}

function ConsequenceTypewriter() {
  const line1Prefix = "Without this layer, these actions would be ";
  const line1Reveal = "allowed to run immediately—with no human gate.";
  const line2 =
    "That could mean sending an email, modifying code, or hitting an API. On screen today: system.note — same control boundary, different risk class.";
  const [revealLen, setRevealLen] = useState(0);
  const [line1Done, setLine1Done] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof globalThis.setInterval> | undefined;
    const startId = globalThis.setTimeout(() => {
      let len = 0;
      intervalId = globalThis.setInterval(() => {
        if (cancelled) return;
        len += 1;
        setRevealLen(len);
        if (len >= line1Reveal.length && intervalId !== undefined) {
          globalThis.clearInterval(intervalId);
          setLine1Done(true);
        }
      }, 34);
    }, 400);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(startId);
      if (intervalId !== undefined) globalThis.clearInterval(intervalId);
    };
  }, [line1Reveal.length]);

  return (
    <div className="mx-auto mt-10 max-w-2xl space-y-6 text-center text-xl leading-relaxed text-zinc-200 md:text-2xl">
      <p>
        <span className="text-zinc-300">{line1Prefix}</span>
        <span className="font-medium text-sky-200/95">
          {line1Reveal.slice(0, revealLen)}
          {revealLen < line1Reveal.length ? (
            <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-sky-400/80 align-middle" />
          ) : null}
        </span>
      </p>
      <p
        className={cn(
          "text-base font-normal text-zinc-400 transition-opacity duration-500 md:text-lg",
          line1Done ? "opacity-100" : "opacity-0",
        )}
      >
        {line2}
      </p>
    </div>
  );
}

const SLIDE_COUNT = 6;

export function Gener8torPitchSlideDeck({
  slideIdPrefix,
  ctaLabel,
  onCta,
  footerHint = "Scroll or use arrow keys · then continue",
}: {
  slideIdPrefix: string;
  ctaLabel: string;
  onCta: () => void;
  footerHint?: string;
}) {
  const slideIds = useMemo(
    () =>
      Array.from({ length: SLIDE_COUNT }, (_, i) => `${slideIdPrefix}-${i}`),
    [slideIdPrefix],
  );
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const assignScrollerRef = useCallback((el: HTMLDivElement | null) => {
    scrollerRef.current = el;
    setScrollRoot(el);
  }, []);

  const scrollToSlide = useCallback(
    (idx: number) => {
      const id = slideIds[idx];
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    },
    [slideIds],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = slideIds.indexOf(e.target.id);
          if (i >= 0) setActive(i);
        }
      },
      { root: el, threshold: 0.55 },
    );

    for (const sid of slideIds) {
      const node = document.getElementById(sid);
      if (node) obs.observe(node);
    }

    return () => obs.disconnect();
  }, [slideIds]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToSlide(Math.min(active + 1, slideIds.length - 1));
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToSlide(Math.max(active - 1, 0));
      }
    },
    [active, scrollToSlide, slideIds.length],
  );

  return (
    <div
      ref={assignScrollerRef}
      role="region"
      aria-label="Gener8tor pitch — six slides"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "relative z-10 h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain outline-none [scrollbar-gutter:stable]",
        "focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]",
      )}
    >
      <section
        id={slideIds[0]}
        aria-label="Jarvis"
        className="flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8"
      >
        <h1
          className={cn(
            "max-w-5xl text-center text-6xl font-semibold tracking-[-0.05em] sm:text-7xl md:text-8xl lg:text-[6rem] lg:leading-[0.95]",
            "demo-pitch-hero-title demo-pitch-hero-mount-1",
          )}
        >
          Jarvis
        </h1>
        <div
          className={cn(
            "mt-12 max-w-xl space-y-2 text-balance text-center",
            "demo-pitch-hero-mount-2",
          )}
        >
          <p className="text-lg font-normal tracking-tight text-zinc-300 md:text-2xl md:font-light">
            Autonomy in thinking.
          </p>
          <p className="text-lg font-medium tracking-tight text-sky-300 md:text-2xl">
            Authority in action.
          </p>
        </div>
        <div
          className={cn(
            "mt-16 h-px w-24 bg-gradient-to-r from-transparent via-zinc-600 to-transparent sm:w-36",
            "demo-pitch-hero-mount-3",
          )}
          aria-hidden
        />
        <p
          className={cn(
            `${demoMono} mt-12 max-w-sm text-center text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500`,
            "demo-pitch-hero-mount-3",
          )}
        >
          Control plane for real agent actions
        </p>
      </section>

      <DeckSlide scrollRoot={scrollRoot} id={slideIds[1]}>
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 2 · Open
        </p>
        <Title as="h1" className="!max-w-3xl">
          Three forces collide at once
        </Title>
        <ul className="mt-12 max-w-lg space-y-6 text-center text-lg font-light leading-relaxed text-zinc-300 md:text-xl">
          <li>Agents take real-world actions</li>
          <li>Email, systems, workflows</li>
          <li className="font-normal text-sky-300">
            {"And what you're about to see is running live"}
          </li>
        </ul>
        <p className="mx-auto mt-12 max-w-md text-center text-sm leading-relaxed text-zinc-400">
          OpenClaw proposes locally → Jarvis ingress → held at approval before
          anything executes.
        </p>
      </DeckSlide>

      <DeckSlide scrollRoot={scrollRoot} id={slideIds[2]}>
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 3 · Consequence
        </p>
        <Title className="!max-w-3xl text-zinc-50">
          No moment where a human owns the decision
        </Title>
        <ConsequenceTypewriter />
      </DeckSlide>

      <DeckSlide scrollRoot={scrollRoot} id={slideIds[3]}>
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 4 · The gap
        </p>
        <Title className="!max-w-3xl text-zinc-50">{"That's the gap"}</Title>
        <ul className="mx-auto mt-10 max-w-xl space-y-5 text-center text-lg leading-relaxed text-zinc-200 md:text-xl">
          <li>
            Enterprises track agents — registries, catalogs, governance layers.
          </li>
          <li className="text-sky-200/85">
            Most of that is visibility — not what happens at execution.
          </li>
          <li>
            {
              "In real systems, risk is real — especially when actions aren't independently verified."
            }
          </li>
        </ul>
        <Subtitle className="mx-auto mt-10 max-w-lg text-zinc-300">
          {"What's missing is control at the moment of execution."}
        </Subtitle>
      </DeckSlide>

      <DeckSlide scrollRoot={scrollRoot} id={slideIds[4]}>
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 5 · Jarvis
        </p>
        <Title className="!max-w-4xl !text-3xl text-zinc-50 sm:!text-4xl md:!text-5xl">
          Approval ≠ execution — plus proof
        </Title>
        <Subtitle className="mx-auto mt-8 max-w-xl text-zinc-300">
          {
            "Jarvis doesn't manage agents — it governs execution. That's where authority lives."
          }
        </Subtitle>
      </DeckSlide>

      <DeckSlide scrollRoot={scrollRoot} id={slideIds[5]}>
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 6 · Handoff
        </p>
        <Title
          as="h1"
          className="!max-w-3xl !text-3xl text-zinc-50 sm:!text-4xl md:!text-5xl"
        >
          propose → approve → execute → receipt → trace
        </Title>
        <Subtitle className="mx-auto mt-8 max-w-xl text-zinc-300">
          Same stack — OpenClaw proposes, Jarvis governs. Most stacks give you
          logs.{" "}
          <span className="font-medium text-sky-200/95">Jarvis gives you proof.</span>
        </Subtitle>
        <p className="mx-auto mt-6 max-w-sm text-center text-sm text-zinc-500">
          Live: intercept → gate → execute → attributable outcome
        </p>
        <button
          type="button"
          onClick={onCta}
          className="mt-16 inline-flex min-w-[12rem] items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-10 py-3.5 text-sm font-medium text-zinc-100 transition-colors duration-200 hover:border-sky-800/50 hover:bg-zinc-800"
        >
          {ctaLabel}
        </button>
        <p className={`${demoMono} mt-6 text-center text-[10px] text-zinc-600`}>
          {footerHint}
        </p>
      </DeckSlide>

      <nav
        className="fixed bottom-6 left-0 right-0 z-20 flex justify-center gap-2"
        aria-label="Slide navigation"
      >
        {slideIds.map((sid, i) => (
          <button
            key={sid}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active === i ? "true" : undefined}
            onClick={() => scrollToSlide(i)}
            className={cn(
              "rounded-full transition-[width,height,background-color] duration-200",
              active === i
                ? "h-2 w-2 bg-sky-400"
                : "h-1.5 w-1.5 bg-zinc-600 hover:bg-zinc-500",
            )}
          />
        ))}
      </nav>
    </div>
  );
}
