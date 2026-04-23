"use client";

import { Gener8torPitchSlideDeck } from "@/components/demo/Gener8torPitchSlideDeck";

export function InvestorPitchSlides({
  onEnterLive,
}: {
  onEnterLive: () => void;
}) {
  return (
    <Gener8torPitchSlideDeck
      slideIdPrefix="demo-g8"
      ctaLabel="Enter live system"
      onCta={onEnterLive}
    />
  );
}
