import { VENUE } from "@/shared/config";
import { AnimatedReveal, Button, SectionHeading, SectionWrapper } from "@/shared/ui";
import { getTranslations } from "next-intl/server";

export async function Location() {
  const t = await getTranslations("Location");

  const mapSrc = `https://maps.google.com/maps?q=${VENUE.coordinates.lat},${VENUE.coordinates.lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`;

  return (
    <SectionWrapper id="location" alternate>
      <div className="mx-auto max-w-5xl">
        <AnimatedReveal direction="up">
          <SectionHeading subtitle={t("subtitle")} align="center">
            {t("title")}
          </SectionHeading>
        </AnimatedReveal>

        <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-center">
          {/* Details */}
          <AnimatedReveal direction="right">
            <div className="flex flex-col gap-5">
              {/* Chips */}
              <div className="flex flex-wrap gap-2">
                <span className="font-cinzel rounded-full border border-accent/30 px-3 py-1 text-xs uppercase tracking-wider text-accent">
                  {t("chip_history")}
                </span>
                <span className="font-cinzel rounded-full border border-accent/30 px-3 py-1 text-xs uppercase tracking-wider text-accent">
                  {t("chip_location")}
                </span>
              </div>

              <h3 className="heading-serif text-2xl md:text-3xl">{t("venue_name")}</h3>
              <p className="text-text-secondary">{t("description")}</p>

              <div className="flex flex-col gap-1">
                <p className="font-cinzel text-xs uppercase tracking-widest text-text-secondary">
                  {VENUE.address}
                </p>
              </div>

              <Button
                as="a"
                href={VENUE.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="md"
                className="w-fit"
              >
                {t("cta")}
              </Button>
            </div>
          </AnimatedReveal>

          {/* Map */}
          <AnimatedReveal direction="left">
            <div className="group overflow-hidden rounded-2xl border border-accent/15 shadow-md">
              <iframe
                src={mapSrc}
                width="100%"
                height="380"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("map_title")}
                className="grayscale transition-all duration-700 group-hover:grayscale-0"
              />
            </div>
          </AnimatedReveal>
        </div>
      </div>
    </SectionWrapper>
  );
}
