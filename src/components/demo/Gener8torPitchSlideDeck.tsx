"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Title } from "@/components/demo/Title";
import { Subtitle } from "@/components/demo/Subtitle";
import { cn } from "@/components/demo/cn";

const demoMono =
  "[font-family:var(--font-demo-mono),ui-monospace,monospace]" as const;

function ConsequenceTypewriter() {
  const line1Prefix = "Without this layer, these actions would be ";
  const line1Reveal = "allowed to run immediately—with no human gate.";
  const line2 =
    "That could mean sending an email, modifying code, or hitting an API. Today you see system notes—the control is the same.";
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

const SLIDE_COUNT = 5;

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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
      ref={scrollerRef}
      role="region"
      aria-label="Gener8tor pitch — five slides"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "relative z-10 h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain outline-none [scrollbar-gutter:stable]",
        "focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]",
      )}
    >
      <section
        id={slideIds[0]}
        className="flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8"
      >
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 1 · Reality
        </p>
        <Title as="h1" className="!max-w-3xl">
          Agents already act in the real world
        </Title>
        <ul className="mt-10 max-w-lg space-y-3 text-center text-lg text-zinc-300 md:text-xl">
          <li>Outbound comms</li>
          <li>Code and systems</li>
          <li>APIs and workflows</li>
        </ul>
        <p className="mx-auto mt-12 max-w-md text-center text-sm text-zinc-500">
          Live capability — not a lab chatbot.
        </p>
      </section>

      <section
        id={slideIds[1]}
        className="flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8"
      >
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 2 · Consequence
        </p>
        <Title className="!max-w-3xl">The failure mode is already here</Title>
        <ConsequenceTypewriter />
      </section>

      <section
        id={slideIds[2]}
        className="flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8"
      >
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 3 · Insight
        </p>
        <Title className="!max-w-3xl">The model is not the authority</Title>
        <Subtitle className="mx-auto mt-6 max-w-lg text-zinc-400">
          Autonomy in thinking. Authority in action.
        </Subtitle>
      </section>

      <section
        id={slideIds[3]}
        className="flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8"
      >
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 4 · System
        </p>
        <Title className="!max-w-4xl !text-3xl sm:!text-4xl md:!text-5xl">
          Proposal → approval → execution → receipt → trace
        </Title>
        <Subtitle className="mx-auto mt-8 max-w-xl text-zinc-400">
          Governs proposals, not runtimes. Proof is the product.
        </Subtitle>
      </section>

      <section
        id={slideIds[4]}
        className="flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-5 py-16 sm:px-8"
      >
        <p
          className={`${demoMono} mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500`}
        >
          Slide 5 · Proof
        </p>
        <Title as="h1" className="!max-w-2xl">
          Live
        </Title>
        <Subtitle className="mx-auto mt-6 max-w-xl text-zinc-400">
          Intercept → gate → execute → attributable outcome
        </Subtitle>
        <button
          type="button"
          onClick={onCta}
          className="mt-14 inline-flex items-center justify-center rounded-full border border-sky-500/45 bg-sky-500/12 px-8 py-3.5 text-sm font-semibold text-sky-100 shadow-[0_0_32px_rgba(56,189,248,0.12)] transition hover:border-sky-400/65 hover:bg-sky-500/18"
        >
          {ctaLabel}
        </button>
        <p className={`${demoMono} mt-6 text-center text-[10px] text-zinc-600`}>
          {footerHint}
        </p>
      </section>

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
              "h-2 w-2 rounded-full transition",
              active === i
                ? "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                : "bg-zinc-600 hover:bg-zinc-500",
            )}
          />
        ))}
      </nav>
    </div>
  );
}
