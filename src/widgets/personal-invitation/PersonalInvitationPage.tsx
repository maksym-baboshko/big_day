import { getLocale, getTranslations } from "next-intl/server";

import type { Guest } from "@/entities/guest";
import { RsvpForm } from "@/features/rsvp";
import { getGuestVocative } from "@/shared/config";
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
import { PersonalInvitationSection } from "./PersonalInvitationSection";

interface PersonalInvitationPageProps {
  guest: Guest;
}

export async function PersonalInvitationPage({ guest }: PersonalInvitationPageProps) {
  const t = await getTranslations("RSVP");
  const locale = await getLocale();
  const vocative = getGuestVocative(guest, locale);

  return (
    <>
      <Splash />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative scroll-mt-24 outline-none">
        <Hero />
        <PersonalInvitationSection guest={guest} />
        <OurStory />
        <Timeline />
        <Location />
        <DressCode />
        <Gifts />

        {/* RSVP */}
        <SectionWrapper id="rsvp" className="relative overflow-hidden pt-12 pb-8 md:py-24">
          <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

          <div className="relative z-10 mx-auto mt-12 flex max-w-7xl flex-col items-center justify-center px-4 md:mt-32 xl:flex-row">
            <RsvpForm slug={guest.slug} guestVocative={vocative} maxSeats={guest.seats} />
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
}
