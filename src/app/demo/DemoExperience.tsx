"use client";

import { useCallback, useState } from "react";
import { DemoCinematicScroll } from "@/components/demo/DemoCinematicScroll";
import { DemoLiveTransition } from "@/components/demo/DemoLiveTransition";
import {
  DemoSpeakerNotesPanel,
  type DemoSpeakerNotesPhase,
} from "@/components/demo/DemoSpeakerNotesPanel";
import { InvestorPitchSlides } from "@/components/demo/InvestorPitchSlides";

type Phase = DemoSpeakerNotesPhase;

/**
 * /demo flow: six slides (Jarvis hero + thesis → Open → Consequence → Gap →
 * Jarvis lock-in → Handoff) → full-screen transition → cinematic proof scroll.
 * Speaker notes: split panel on sm+ beside the deck; mobile drawer (N).
 * See docs/strategy/gener8tor-pitch.md and investor-demo-narrative-script.md.
 */
export function DemoExperience() {
  const [phase, setPhase] = useState<Phase>("slides");
  const [slideIndex, setSlideIndex] = useState(0);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);

  const enterTransition = useCallback(() => setPhase("transition"), []);
  const enterLive = useCallback(() => setPhase("live"), []);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#09090b] text-zinc-100 sm:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {phase === "slides" && (
          <InvestorPitchSlides
            onEnterLive={enterTransition}
            onSlideChange={setSlideIndex}
          />
        )}

        {phase === "transition" && <DemoLiveTransition onDone={enterLive} />}

        {phase === "live" && (
          <div className="relative z-10 h-full snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            <DemoCinematicScroll />
          </div>
        )}
      </div>

      <DemoSpeakerNotesPanel
        phase={phase}
        slideIndex={slideIndex}
        mobileOpen={mobileNotesOpen}
        onMobileOpenChange={setMobileNotesOpen}
      />
    </div>
  );
}
