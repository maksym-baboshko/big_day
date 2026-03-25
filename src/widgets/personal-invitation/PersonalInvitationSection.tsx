import { getLocale, getTranslations } from "next-intl/server";

import type { Guest } from "@/entities/guest";
import { VENUE, WEDDING_DATE_ROMAN } from "@/shared/config";
import { AnimatedReveal, SectionWrapper } from "@/shared/ui";

interface PersonalInvitationSectionProps {
  guest: Guest;
}

export async function PersonalInvitationSection({ guest }: PersonalInvitationSectionProps) {
  const t = await getTranslations("PersonalInvitation");
  const locale = await getLocale();
  const vocative = locale === "uk" ? guest.vocative.uk : guest.vocative.en;

  return (
    <SectionWrapper id="personal-invite" alternate>
      <div className="mx-auto max-w-2xl">
        <AnimatedReveal direction="up">
          <p className="font-cinzel mb-4 text-center text-xs uppercase tracking-[0.3em] text-accent">
            {t("eyebrow")}
          </p>
        </AnimatedReveal>

        <AnimatedReveal direction="up" delay={0.1}>
          <h2 className="heading-serif mb-8 text-center text-2xl md:text-3xl">{t("headline")}</h2>
        </AnimatedReveal>

        <AnimatedReveal direction="up" delay={0.15}>
          <p className="mb-4 leading-relaxed text-text-secondary">
            {t("body_1", { name: vocative })}
          </p>
          <p className="mb-8 leading-relaxed text-text-secondary">{t("body_2")}</p>
        </AnimatedReveal>

        <AnimatedReveal direction="up" delay={0.2}>
          <p className="heading-serif-italic mb-10 text-center text-lg text-accent">
            — {t("closing")}
          </p>
        </AnimatedReveal>

        {/* Details card */}
        <AnimatedReveal direction="up" delay={0.25}>
          <div className="rounded-2xl border border-accent/20 bg-bg-primary p-8">
            {/* Seats */}
            <div className="mb-6 text-center">
              <p className="font-cinzel mb-1 text-xs uppercase tracking-widest text-text-secondary">
                {t("seats_label")}
              </p>
              <p className="font-cinzel text-4xl font-bold text-accent">{guest.seats}</p>
              <p className="font-cinzel mt-1 text-sm text-text-secondary">
                {t("seat_word", { seats: guest.seats })}
              </p>
            </div>

            <div className="mx-auto mb-6 h-px w-16 bg-accent/20" />

            <p className="font-cinzel mb-4 text-center text-xs uppercase tracking-widest text-text-secondary">
              {t("details_label")}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-cinzel mb-1 text-[10px] uppercase tracking-widest text-text-secondary/70">
                  {t("date_label")}
                </p>
                <p className="font-cinzel text-sm font-bold text-text-primary">
                  {WEDDING_DATE_ROMAN}
                </p>
              </div>
              <div>
                <p className="font-cinzel mb-1 text-[10px] uppercase tracking-widest text-text-secondary/70">
                  {t("venue_label")}
                </p>
                <p className="font-cinzel text-sm font-bold text-text-primary">{VENUE.name}</p>
                <p className="text-xs text-text-secondary">{VENUE.locationShort}</p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs italic text-text-secondary">
              {t("details_note")}
            </p>
          </div>
        </AnimatedReveal>

        <AnimatedReveal direction="up" delay={0.3}>
          <p className="mt-6 text-center text-xs text-text-secondary">{t("seats_note")}</p>
        </AnimatedReveal>
      </div>
    </SectionWrapper>
  );
}
