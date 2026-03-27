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
      <div className="relative flex min-h-screen w-full flex-col items-center justify-between py-12 md:pb-8 md:pt-24">
        <Ornament position="top-left" size="lg" />
        <Ornament position="top-right" size="lg" />
        <Ornament position="bottom-left" size="md" />
        <Ornament position="bottom-right" size="md" />

        <div className="h-12 flex-none md:h-24" />
        <InvitationHeroIntro />
      </div>
    </SectionShell>
  );
}
