"use client";

import { Ornament, SectionShell } from "@/shared/ui";
import { InvitationHeroIntro } from "./InvitationHeroIntro";

export function Hero() {
  return (
    <SectionShell
      id="hero"
      fullHeight
      padding="none"
      fadeEdges={false}
      background="primary"
      contentWidth="full"
      className="relative overflow-hidden"
    >
      <div className="relative flex min-h-[100svh] w-full flex-col items-center justify-center px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-[calc(5.75rem+env(safe-area-inset-top))] md:pt-24">
        <Ornament position="top-left" size="lg" className="-left-4 md:left-0" />
        <Ornament position="top-right" size="lg" className="-right-4 md:right-0" />
        <Ornament position="bottom-left" size="lg" className="-left-4 md:left-0" />
        <Ornament position="bottom-right" size="lg" className="-right-4 md:right-0" />

        <InvitationHeroIntro />
      </div>
    </SectionShell>
  );
}
