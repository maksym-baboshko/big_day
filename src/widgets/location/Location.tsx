"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
import { type Variants, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { VENUE } from "@/shared/config";
import { MOTION_EASE, cn, useLiteMotion } from "@/shared/lib";
import { AnimatedReveal, Button, SectionHeading, SectionWrapper } from "@/shared/ui";

const chips = [
  { icon: "\u{1F3DB}\u{FE0F}", key: "chip_history" },
  { icon: "\u{1F4CD}", key: "chip_location" },
] as const;

const ease = MOTION_EASE;

const mobilePinHaloTransition = {
  duration: 4.2,
  repeat: Number.POSITIVE_INFINITY,
  ease: "easeInOut" as const,
};

const mobilePinRippleTransition = {
  duration: 3.2,
  repeat: Number.POSITIVE_INFINITY,
  ease: "linear" as const,
  times: [0, 0.22, 1],
};

const mobileCardVariants: Variants = {
  hidden: {
    opacity: 0.001,
    y: 22,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease,
    },
  },
};

const mobileMapVariants: Variants = {
  hidden: {
    opacity: 0.001,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease,
    },
  },
};

export function Location() {
  const t = useTranslations("Location");
  const liteMotion = useLiteMotion();

  return (
    <SectionWrapper id="location" className="relative overflow-hidden py-24">
      {!liteMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-100 w-200 rounded-full bg-accent/5 blur-3xl" />
        </div>
      )}

      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

      <div className="relative z-10 mx-auto mt-16 max-w-6xl px-4 md:mt-24">
        {liteMotion ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={mobileCardVariants}
            className="min-h-130 flex flex-col overflow-hidden rounded-3xl border border-accent/22 bg-bg-secondary/32 shadow-[0_8px_80px_rgba(0,0,0,0.12)] lg:flex-row"
          >
            <div className="flex flex-col items-center p-8 text-center lg:w-1/2 lg:items-start lg:p-14 lg:text-left md:p-12">
              <div className="relative mb-8 inline-flex items-center justify-center">
                <motion.span
                  animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.18, 0.28, 0.18] }}
                  transition={mobilePinHaloTransition}
                  className="absolute inline-flex h-18 w-18 rounded-full bg-accent/12"
                  style={{ willChange: "transform, opacity" }}
                />
                <motion.span
                  animate={{ scale: [0.82, 1.04, 1.42], opacity: [0, 0.3, 0] }}
                  transition={mobilePinRippleTransition}
                  className="absolute inline-flex h-16 w-16 rounded-full border border-accent/34"
                  style={{ willChange: "transform, opacity" }}
                />
                <motion.div
                  animate={{ scale: [0.82, 1.04, 1.42], opacity: [0, 0.22, 0] }}
                  transition={{ ...mobilePinRippleTransition, delay: -1.6 }}
                  className="absolute inline-flex h-16 w-16 rounded-full border border-accent/28"
                  style={{ willChange: "transform, opacity" }}
                />
                <motion.div
                  animate={{ scale: [1, 1.018, 1] }}
                  transition={{
                    duration: 4.6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="relative inline-flex items-center justify-center rounded-full bg-accent/18 p-4 text-accent ring-1 ring-accent/24"
                  style={{ willChange: "transform" }}
                >
                  <MapPin className="h-6 w-6" />
                </motion.div>
              </div>

              <h3 className="heading-serif mb-3 text-3xl text-text-primary md:text-4xl">
                {t("venue_name")}
              </h3>

              <p className="mb-6 font-cinzel text-xs uppercase tracking-widest text-accent">
                {t("address")}
              </p>

              <div className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start">
                {chips.map(({ icon, key }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/22 bg-accent/12 px-3 py-1.5 text-xs font-medium text-accent"
                  >
                    <span>{icon}</span>
                    {t(key)}
                  </span>
                ))}
              </div>

              <p className="mb-10 max-w-md leading-relaxed text-text-secondary">
                {t("description")}
              </p>

              <div>
                <Button
                  as="a"
                  href={VENUE.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="group"
                >
                  {t("cta")}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </div>
            </div>

            <motion.div
              variants={mobileMapVariants}
              className="relative min-h-75 border-t border-accent/16 lg:min-h-0 lg:w-1/2 lg:border-l lg:border-accent/16 lg:border-t-0"
            >
              <iframe
                src={VENUE.mapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0, position: "absolute", inset: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("map_title")}
                className="google-map-iframe grayscale-[0.2] transition-all duration-700 hover:grayscale-0"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 shadow-[inset_8px_0_24px_rgba(0,0,0,0.08)]"
              />
            </motion.div>
          </motion.div>
        ) : (
          <AnimatedReveal direction="up">
            <div className="min-h-130 flex flex-col overflow-hidden rounded-3xl border border-accent/22 bg-bg-secondary/32 shadow-[0_8px_80px_rgba(0,0,0,0.12)] lg:flex-row">
              <div className="flex flex-col items-center p-8 text-center lg:w-1/2 lg:items-start lg:p-14 lg:text-left md:p-12">
                <div className="relative mb-8 inline-flex items-center justify-center">
                  <span
                    className={cn(
                      "absolute inline-flex h-16 w-16 rounded-full bg-accent/20",
                      "animate-ping",
                    )}
                    style={{ animationDuration: "2.5s" }}
                  />
                  <div className="relative inline-flex items-center justify-center rounded-full bg-accent/18 p-4 text-accent ring-1 ring-accent/24">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="heading-serif mb-3 text-3xl text-text-primary md:text-4xl">
                  {t("venue_name")}
                </h3>

                <p className="mb-6 font-cinzel text-xs uppercase tracking-widest text-accent">
                  {t("address")}
                </p>

                <div className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {chips.map(({ icon, key }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/22 bg-accent/12 px-3 py-1.5 text-xs font-medium text-accent"
                    >
                      <span>{icon}</span>
                      {t(key)}
                    </span>
                  ))}
                </div>

                <p className="mb-10 max-w-md leading-relaxed text-text-secondary">
                  {t("description")}
                </p>

                <Button
                  as="a"
                  href={VENUE.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="group"
                >
                  {t("cta")}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </div>

              <div className="relative min-h-75 border-t border-accent/16 lg:min-h-0 lg:w-1/2 lg:border-l lg:border-accent/16 lg:border-t-0">
                <iframe
                  src={VENUE.mapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: "absolute", inset: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("map_title")}
                  className="google-map-iframe grayscale-[0.2] transition-all duration-700 hover:grayscale-0"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 shadow-[inset_8px_0_24px_rgba(0,0,0,0.08)]"
                />
              </div>
            </div>
          </AnimatedReveal>
        )}
      </div>
    </SectionWrapper>
  );
}
