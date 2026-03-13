"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { SectionWrapper, SectionHeading, AnimatedReveal, Ornament } from "@/shared/ui";
import { useLiteMotion } from "@/shared/lib";

const ease = [0.22, 1, 0.36, 1] as const;
const mobilePortraitVariants: Variants = {
  hidden: (direction: "left" | "right") => ({
    opacity: 0.001,
    x: direction === "left" ? -18 : 18,
    y: 18,
    scale: 0.985,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.56,
      ease,
    },
  },
};

const mobileImageVariants: Variants = {
  hidden: {
    scale: 1.045,
    opacity: 0.001,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.72,
      ease,
    },
  },
};

export function OurStory() {
  const t = useTranslations("OurStory");
  const liteMotion = useLiteMotion();

  return (
    <SectionWrapper id="our-story" className="relative overflow-hidden py-24">
      <Ornament position="top-left" size="sm" />
      <Ornament position="top-right" size="sm" />
      <Ornament position="bottom-left" size="sm" />
      <Ornament position="bottom-right" size="sm" />

      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

      <div className="max-w-5xl mx-auto px-4 mt-16 md:mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 mb-12 md:mb-24 relative">
          {!liteMotion && (
            <>
              <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-accent/8 rounded-full blur-[80px] pointer-events-none -translate-x-1/2" />
              <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-accent/8 rounded-full blur-[80px] pointer-events-none translate-x-1/2" />
            </>
          )}

          {liteMotion ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={mobilePortraitVariants}
              custom="left"
              className="flex flex-col items-center"
              style={{ willChange: "transform, opacity" }}
            >
              <div className="relative w-full max-w-70 aspect-3/4 mb-4 md:mb-8 group">
                <div className="absolute inset-0 border border-accent/70 rounded-t-[100px] rounded-b-sm transition-all duration-500 group-hover:border-accent shadow-[0_0_0_0_transparent] group-hover:shadow-[0_0_30px_4px_color-mix(in_srgb,var(--accent)_15%,transparent)] z-10 pointer-events-none" />
                <div className="absolute inset-2 border border-accent/60 rounded-t-[92px] rounded-b-sm z-20 pointer-events-none" />

                <div className="absolute inset-0 rounded-t-[100px] rounded-b-sm overflow-hidden">
                  {liteMotion ? (
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.5 }}
                      variants={mobileImageVariants}
                      className="h-full w-full transform-gpu"
                      style={{ willChange: "transform, opacity" }}
                    >
                      <Image
                        src="/images/story/groom.jpg"
                        alt={t("groom_name")}
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                    </motion.div>
                  ) : (
                    <Image
                      src="/images/story/groom.jpg"
                      alt={t("groom_name")}
                      fill
                      sizes="280px"
                      className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                    />
                  )}
                </div>
              </div>

              <h3 className="heading-serif text-3xl md:text-4xl text-text-primary mb-2 text-center">
                {t("groom_name")}
              </h3>
              <span className="text-xs tracking-widest uppercase text-accent font-medium text-center">
                {t("groom_bio")}
              </span>
            </motion.div>
          ) : (
            <AnimatedReveal direction="up" delay={0.1}>
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-70 aspect-3/4 mb-4 md:mb-8 group">
                  <div className="absolute inset-0 border border-accent/70 rounded-t-[100px] rounded-b-sm transition-all duration-500 group-hover:border-accent shadow-[0_0_0_0_transparent] group-hover:shadow-[0_0_30px_4px_color-mix(in_srgb,var(--accent)_15%,transparent)] z-10 pointer-events-none" />
                  <div className="absolute inset-2 border border-accent/60 rounded-t-[92px] rounded-b-sm z-20 pointer-events-none" />

                  <div className="absolute inset-0 rounded-t-[100px] rounded-b-sm overflow-hidden">
                    <Image
                      src="/images/story/groom.jpg"
                      alt={t("groom_name")}
                      fill
                      sizes="280px"
                      className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                    />
                  </div>
                </div>

                <h3 className="heading-serif text-3xl md:text-4xl text-text-primary mb-2 text-center">
                  {t("groom_name")}
                </h3>
                <span className="text-xs tracking-widest uppercase text-accent font-medium text-center">
                  {t("groom_bio")}
                </span>
              </div>
            </AnimatedReveal>
          )}

          {liteMotion ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={mobilePortraitVariants}
              custom="right"
              className="flex flex-col items-center md:pt-16"
              style={{ willChange: "transform, opacity" }}
            >
              <div className="relative w-full max-w-70 aspect-3/4 mb-4 md:mb-8 group">
                <div className="absolute inset-0 border border-accent/70 rounded-t-[100px] rounded-b-sm transition-all duration-500 group-hover:border-accent shadow-[0_0_0_0_transparent] group-hover:shadow-[0_0_30px_4px_color-mix(in_srgb,var(--accent)_15%,transparent)] z-10 pointer-events-none" />
                <div className="absolute inset-2 border border-accent/60 rounded-t-[92px] rounded-b-sm z-20 pointer-events-none" />

                <div className="absolute inset-0 rounded-t-[100px] rounded-b-sm overflow-hidden">
                  {liteMotion ? (
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.5 }}
                      variants={mobileImageVariants}
                      className="h-full w-full transform-gpu"
                      style={{ willChange: "transform, opacity" }}
                    >
                      <Image
                        src="/images/story/bride.jpg"
                        alt={t("bride_name")}
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                    </motion.div>
                  ) : (
                    <Image
                      src="/images/story/bride.jpg"
                      alt={t("bride_name")}
                      fill
                      sizes="280px"
                      className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                    />
                  )}
                </div>
              </div>

              <h3 className="heading-serif text-3xl md:text-4xl text-text-primary mb-2 text-center">
                {t("bride_name")}
              </h3>
              <span className="text-xs tracking-widest uppercase text-accent font-medium text-center">
                {t("bride_bio")}
              </span>
            </motion.div>
          ) : (
            <AnimatedReveal direction="up" delay={0.2}>
              <div className="flex flex-col items-center md:pt-16">
                <div className="relative w-full max-w-70 aspect-3/4 mb-4 md:mb-8 group">
                  <div className="absolute inset-0 border border-accent/70 rounded-t-[100px] rounded-b-sm transition-all duration-500 group-hover:border-accent shadow-[0_0_0_0_transparent] group-hover:shadow-[0_0_30px_4px_color-mix(in_srgb,var(--accent)_15%,transparent)] z-10 pointer-events-none" />
                  <div className="absolute inset-2 border border-accent/60 rounded-t-[92px] rounded-b-sm z-20 pointer-events-none" />

                  <div className="absolute inset-0 rounded-t-[100px] rounded-b-sm overflow-hidden">
                    <Image
                      src="/images/story/bride.jpg"
                      alt={t("bride_name")}
                      fill
                      sizes="280px"
                      className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                    />
                  </div>
                </div>

                <h3 className="heading-serif text-3xl md:text-4xl text-text-primary mb-2 text-center">
                  {t("bride_name")}
                </h3>
                <span className="text-xs tracking-widest uppercase text-accent font-medium text-center">
                  {t("bride_bio")}
                </span>
              </div>
            </AnimatedReveal>
          )}
        </div>

        <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.1} threshold={0.1}>
          <div className="max-w-3xl mx-auto text-center pt-8 md:pt-16 relative">
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-5 -translate-y-1/2">
              <div className="flex-1 h-px bg-accent/30" />
              <div className="text-accent/70 shrink-0 drop-shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_50%,transparent)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className="flex-1 h-px bg-accent/30" />
            </div>

            <h4 className="heading-serif-italic text-2xl md:text-3xl text-text-primary mb-6">
              {t("how_we_met_title")}
            </h4>

            <p className="text-base md:text-lg text-text-secondary leading-relaxed md:leading-loose max-w-2xl mx-auto">
              {t("how_we_met_text")}
            </p>
          </div>
        </AnimatedReveal>
      </div>
    </SectionWrapper>
  );
}
