import { getLocale, getTranslations } from "next-intl/server";

import type { GuestProfile } from "@/entities/guest";
import { getInvitationContent } from "@/entities/guest";
import { RsvpForm } from "@/features/rsvp";
import { SectionHeading, SectionShell } from "@/shared/ui";
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
  guest: GuestProfile;
}

export async function PersonalInvitationPage({ guest }: PersonalInvitationPageProps) {
  const t = await getTranslations("RSVP");
  const locale = await getLocale();
  const invitationContent = getInvitationContent(guest.slug, locale === "en" ? "en" : "uk");

  if (!invitationContent) {
    return null;
  }

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
        <SectionShell
          id="rsvp"
          background="primary"
          padding="compact"
          contentWidth="wide"
          fadeEdges={false}
          className="relative overflow-hidden"
        >
          <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

          <div className="relative z-10 mx-auto mt-12 flex max-w-7xl flex-col items-center justify-center px-4 md:mt-32 xl:flex-row">
            <RsvpForm
              slug={guest.slug}
              guestVocative={invitationContent.guestVocative}
              maxSeats={invitationContent.maxSeats}
              initialGuestName={invitationContent.defaultGuestName}
            />
          </div>
        </SectionShell>
      </main>
      <Footer />
    </>
  );
}
