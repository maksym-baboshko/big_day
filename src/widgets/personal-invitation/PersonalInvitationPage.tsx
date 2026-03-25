import { getLocale, getTranslations } from "next-intl/server";

import type { Guest } from "@/entities/guest";
import { RsvpForm } from "@/features/rsvp";
import { getGuestVocative } from "@/shared/config";
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
      <main id="main-content">
        <Hero />
        <PersonalInvitationSection guest={guest} />
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

            {/* Personalized seat note */}
            <AnimatedReveal direction="up" delay={0.1}>
              <div className="mb-6 rounded-2xl border border-accent/15 bg-bg-secondary px-6 py-4">
                <p className="font-cinzel mb-1 text-xs uppercase tracking-widest text-text-secondary">
                  {t("personalized_note_label")}
                </p>
                <p className="text-sm text-text-secondary">
                  {t("personalized_note", { name: vocative, seats: guest.seats })}
                </p>
              </div>
            </AnimatedReveal>

            <RsvpForm slug={guest.slug} guestVocative={vocative} maxSeats={guest.seats} />
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
}
