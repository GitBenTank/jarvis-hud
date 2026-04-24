"use client";

import { useCallback, useState } from "react";
import { DemoCinematicScroll } from "@/components/demo/DemoCinematicScroll";
import { DemoLiveTransition } from "@/components/demo/DemoLiveTransition";
import { InvestorPitchSlides } from "@/components/demo/InvestorPitchSlides";

type Phase = "slides" | "transition" | "live";

/**
 * /demo flow: six slides (Jarvis hero + thesis → Open → Consequence → Gap →
 * Jarvis lock-in → Handoff) → full-screen transition → cinematic proof scroll.
 * See docs/strategy/gener8tor-pitch.md and investor-demo-narrative-script.md.
 */
export function DemoExperience() {
  const [phase, setPhase] = useState<Phase>("slides");

  const enterTransition = useCallback(() => setPhase("transition"), []);
  const enterLive = useCallback(() => setPhase("live"), []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#09090b] text-zinc-100">
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
