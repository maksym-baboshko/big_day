import { getTranslations } from "next-intl/server";

import { RsvpForm } from "@/features/rsvp";
import { SectionHeading, SectionWrapper } from "@/shared/ui";
import { DressCode } from "@/widgets/dress-code";
import { Footer } from "@/widgets/footer";
import { Gifts } from "@/widgets/gifts";
import { Hero } from "@/widgets/hero";
import { Location } from "@/widgets/location";
import { Navbar } from "@/widgets/navbar";
import { OurStory } from "@/widgets/our-story";
import { Splash } from "@/widgets/splash";
import { Timeline } from "@/widgets/timeline";

export async function InvitationPage() {
  const t = await getTranslations("RSVP");

  return (
    <>
      <Splash />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative scroll-mt-24 outline-none">
        <Hero />
        <OurStory />
        <Timeline />
        <Location />
        <DressCode />
        <Gifts />

        {/* RSVP */}
        <SectionWrapper id="rsvp" className="relative overflow-hidden pt-12 pb-8 md:py-24">
          <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

          <div className="relative z-10 mx-auto mt-12 flex max-w-7xl flex-col items-center justify-center px-4 md:mt-32 xl:flex-row">
            <RsvpForm />
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
}
