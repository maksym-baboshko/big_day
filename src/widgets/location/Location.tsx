"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, ArrowUpRight } from "lucide-react";
import { SectionWrapper, SectionHeading, AnimatedReveal, Button, Ornament } from "@/shared/ui";
import { VENUE } from "@/shared/config";
import { cn, useLiteMotion } from "@/shared/lib";

const chips = [
  { icon: "\u{1F3DB}\u{FE0F}", key: "chip_history" },
  { icon: "\u{1F4CD}", key: "chip_location" },
] as const;
const ease = [0.22, 1, 0.36, 1] as const;
const mobilePinHaloTransition = {
  duration: 4.2,
  repeat: Infinity,
  ease: "easeInOut" as const,
};
const mobilePinRippleTransition = {
  duration: 3.2,
  repeat: Infinity,
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

  const googleMapsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=Grand+Hotel+Terminus+Bergen";

  return (
    <SectionWrapper id="location" className="relative overflow-hidden py-24">
      <Ornament position="top-left" size="lg" className="opacity-20 z-30" />
      <Ornament position="bottom-right" size="lg" className="opacity-20 z-30" />

      {!liteMotion && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div className="w-200 h-100 rounded-full bg-accent/5 blur-3xl" />
        </div>
      )}

      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

      <div className="max-w-6xl mx-auto px-4 mt-16 md:mt-24 relative z-10">
        {liteMotion ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={mobileCardVariants}
            className="rounded-3xl border border-accent/15 bg-bg-secondary/20 shadow-[0_8px_80px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col lg:flex-row min-h-130"
          >
            <div className="lg:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col items-center lg:items-start text-center lg:text-left">

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
                  className="absolute inline-flex h-16 w-16 rounded-full border border-accent/28"
                  style={{ willChange: "transform, opacity" }}
                />
                <motion.div
                  animate={{ scale: [0.82, 1.04, 1.42], opacity: [0, 0.22, 0] }}
                  transition={{ ...mobilePinRippleTransition, delay: -1.6 }}
                  className="absolute inline-flex h-16 w-16 rounded-full border border-accent/22"
                  style={{ willChange: "transform, opacity" }}
                />
                <motion.div
                  animate={{ scale: [1, 1.018, 1] }}
                  transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative inline-flex items-center justify-center rounded-full bg-accent/15 p-4 text-accent ring-1 ring-accent/20"
                  style={{ willChange: "transform" }}
                >
                  <MapPin className="h-6 w-6" />
                </motion.div>
              </div>

              <h3 className="heading-serif text-3xl md:text-4xl text-text-primary mb-3">
                {t("venue_name")}
              </h3>

              <p className="font-cinzel text-xs text-accent/80 tracking-widest uppercase mb-6">
                {t("address")}
              </p>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
                {chips.map(({ icon, key }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 text-accent/90 border border-accent/15"
                  >
                    <span>{icon}</span>
                    {t(key)}
                  </span>
                ))}
              </div>

              <p className="text-text-secondary leading-relaxed mb-10 max-w-md">
                {t("description")}
              </p>

              <div>
                <Button
                  as="a"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="group"
                >
                  {t("cta")}
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </div>
            </div>

            <motion.div
              variants={mobileMapVariants}
              className="lg:w-1/2 relative min-h-75 lg:min-h-0 border-t border-accent/10 lg:border-t-0 lg:border-l lg:border-accent/10"
            >
              <iframe
                src={VENUE.mapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0, position: "absolute", inset: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="google-map-iframe grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none shadow-[inset_8px_0_24px_rgba(0,0,0,0.08)]"
              />
            </motion.div>
          </motion.div>
        ) : (
          <AnimatedReveal direction="up">
            <div className="rounded-3xl border border-accent/15 bg-bg-secondary/20 shadow-[0_8px_80px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col lg:flex-row min-h-130">

              <div className="lg:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col items-center lg:items-start text-center lg:text-left">

                <div className="relative mb-8 inline-flex items-center justify-center">
                  <span
                    className={cn("absolute inline-flex h-16 w-16 rounded-full bg-accent/20", "animate-ping")}
                    style={{ animationDuration: "2.5s" }}
                  />
                  <div className="relative inline-flex items-center justify-center rounded-full bg-accent/15 p-4 text-accent ring-1 ring-accent/20">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="heading-serif text-3xl md:text-4xl text-text-primary mb-3">
                  {t("venue_name")}
                </h3>

                <p className="font-cinzel text-xs text-accent/80 tracking-widest uppercase mb-6">
                  {t("address")}
                </p>

                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
                  {chips.map(({ icon, key }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 text-accent/90 border border-accent/15"
                    >
                      <span>{icon}</span>
                      {t(key)}
                    </span>
                  ))}
                </div>

                <p className="text-text-secondary leading-relaxed mb-10 max-w-md">
                  {t("description")}
                </p>

                <Button
                  as="a"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="group"
                >
                  {t("cta")}
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </div>

              <div className="lg:w-1/2 relative min-h-75 lg:min-h-0 border-t border-accent/10 lg:border-t-0 lg:border-l lg:border-accent/10">
                <iframe
                  src={VENUE.mapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: "absolute", inset: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="google-map-iframe grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none shadow-[inset_8px_0_24px_rgba(0,0,0,0.08)]"
                />
              </div>
            </div>
          </AnimatedReveal>
        )}
      </div>
    </SectionWrapper>
  );
}
