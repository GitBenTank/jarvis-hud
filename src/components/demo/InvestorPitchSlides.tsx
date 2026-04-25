"use client";

import { Gener8torPitchSlideDeck } from "@/components/demo/Gener8torPitchSlideDeck";

export function InvestorPitchSlides({
  onEnterLive,
  onSlideChange,
}: {
  onEnterLive: () => void;
  onSlideChange?: (slideIndex: number) => void;
}) {
  return (
    <Gener8torPitchSlideDeck
      slideIdPrefix="demo-g8"
      ctaLabel="Enter live system"
      onCta={onEnterLive}
      onActiveSlideChange={onSlideChange}
      footerHint="Scroll or arrow keys · notes beside you (mobile: N) · then continue"
      slideNavClassName="right-0 max-sm:right-0 sm:right-[min(420px,40vw)]"
    />
  );
}
