"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DemoSpeakerNotesPanel,
  type DemoSpeakerNotesPhase,
} from "@/components/demo/DemoSpeakerNotesPanel";
import { InvestorPitchSlides } from "@/components/demo/InvestorPitchSlides";

/**
 * /demo flow: six slides (Jarvis hero + thesis → … → Handoff). **Enter live system**
 * navigates to **`/`** (HUD home, same origin—e.g. http://127.0.0.1:3000/). Live proof
 * (OpenClaw, proposals, email) continues in the HUD + docs run sheet—not in-page here.
 * Speaker notes: split panel on sm+ beside the deck; mobile drawer (N).
 */
export function DemoExperience() {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);

  /** In-app cinematic scroll (`DemoCinematicScroll`) removed from this path—use deck + HUD. */
  const phase: DemoSpeakerNotesPhase = "slides";

  const goHudHome = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#09090b] text-zinc-100 sm:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <InvestorPitchSlides
          onEnterLive={goHudHome}
          onSlideChange={setSlideIndex}
        />
      </div>

      <DemoSpeakerNotesPanel
        phase={phase}
        slideIndex={slideIndex}
        mobileOpen={mobileNotesOpen}
        onMobileOpenChange={setMobileNotesOpen}
        postDeckTabs
      />
    </div>
  );
}
