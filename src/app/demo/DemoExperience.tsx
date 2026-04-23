"use client";

import { useCallback, useState } from "react";
import { DemoCinematicScroll } from "@/components/demo/DemoCinematicScroll";
import { DemoLiveTransition } from "@/components/demo/DemoLiveTransition";
import { InvestorPitchSlides } from "@/components/demo/InvestorPitchSlides";

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

type Phase = "slides" | "transition" | "live";

/**
 * /demo flow: five investor slides (inevitability) → full-screen transition →
 * cinematic proof scroll (lifecycle, mock, HUD link, close). See
 * docs/strategy/gener8tor-pitch.md.
 */
export function DemoExperience() {
  const [phase, setPhase] = useState<Phase>("slides");

  const enterTransition = useCallback(() => setPhase("transition"), []);
  const enterLive = useCallback(() => setPhase("live"), []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#050508] text-zinc-100">
      <Ambient />

      {phase === "slides" && (
        <InvestorPitchSlides onEnterLive={enterTransition} />
      )}

      {phase === "transition" && <DemoLiveTransition onDone={enterLive} />}

      {phase === "live" && (
        <div className="relative z-10 h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
          <DemoCinematicScroll />
        </div>
      )}
    </div>
  );
}
