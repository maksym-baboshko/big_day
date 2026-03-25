import { getTranslations } from "next-intl/server";

import { RsvpForm } from "@/features/rsvp";
import { AnimatedReveal, SectionHeading, SectionWrapper } from "@/shared/ui";
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
      <main id="main-content">
        <Hero />
        <OurStory />
        <Timeline />
        <Location />
        <DressCode />
        <Gifts />

        {/* RSVP */}
        <SectionWrapper id="rsvp">
          <div className="mx-auto max-w-lg">
            <AnimatedReveal direction="up">
              <SectionHeading subtitle={t("subtitle")} align="center">
                {t("title")}
              </SectionHeading>
            </AnimatedReveal>
            <div className="mt-8">
              <RsvpForm />
            </div>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
}
