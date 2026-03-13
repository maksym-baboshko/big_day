"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { SectionWrapper, AnimatedReveal, Ornament } from "@/shared/ui";
import { Countdown } from "@/features/countdown/Countdown";
import { useLiteMotion } from "@/shared/lib";

const ease = [0.22, 1, 0.36, 1] as const;
const mobileHeroVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const mobileHeroItemVariants: Variants = {
  hidden: {
    opacity: 0.001,
    y: 22,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease,
    },
  },
};

const mobileHeroTitleVariants: Variants = {
  hidden: {
    opacity: 0.001,
    y: 28,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.86,
      ease,
    },
  },
};

export function Hero() {
  const t = useTranslations("Hero");
  const liteMotion = useLiteMotion();
  const reduceMotion = useReducedMotion();

  return (
    <SectionWrapper
      id="hero"
      fullHeight
      noPadding
      className="relative overflow-hidden"
    >
      <div className="min-h-screen w-full flex flex-col items-center justify-between relative py-12 md:pt-24 md:pb-8">
        <Ornament position="top-left" size="lg" />
        <Ornament position="top-right" size="lg" />
        <Ornament position="bottom-left" size="md" />
        <Ornament position="bottom-right" size="md" />

        <div className="flex-none h-12 md:h-24" />

        {liteMotion ? (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={mobileHeroVariants}
              className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl px-4 relative z-10"
            >
              <motion.h1
                variants={mobileHeroTitleVariants}
                className="heading-serif mb-10 text-center text-6xl leading-[0.9] text-text-primary sm:text-7xl md:mb-16 md:text-7xl lg:text-8xl xl:text-[100px]"
                style={{ willChange: "transform, opacity" }}
              >
                <span className="hidden whitespace-nowrap md:inline-block">
                  {t("groom_name")} <span className="text-accent italic">&</span> {t("bride_name")}
                </span>

                <span className="flex flex-col items-center leading-tight md:hidden">
                  <span>{t("groom_name")}</span>
                  <motion.span
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            scale: [1, 1.06, 1],
                            opacity: [0.88, 1, 0.88],
                          }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            duration: 4.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                    className="my-4 text-5xl text-accent"
                    style={{ willChange: reduceMotion ? "auto" : "transform, opacity" }}
                  >
                    &
                  </motion.span>
                  <span>{t("bride_name")}</span>
                </span>
              </motion.h1>

              <motion.div
                variants={mobileHeroItemVariants}
                className="mb-16 flex flex-col items-center justify-center gap-4 md:mb-24 md:flex-row md:gap-8"
                style={{ willChange: "transform, opacity" }}
              >
                <span className="text-sm font-medium uppercase tracking-widest text-text-secondary md:text-base lg:text-lg">
                  {t("date")}
                </span>
                <span className="hidden h-1.5 w-1.5 rounded-full bg-accent/40 md:inline-block" />
                <span className="text-sm font-medium uppercase tracking-widest text-text-secondary md:text-base lg:text-lg">
                  {t("location")}
                </span>
              </motion.div>

              <motion.div
                variants={mobileHeroItemVariants}
                className="scale-90 sm:scale-100"
                style={{ willChange: "transform, opacity" }}
              >
                <Countdown />
              </motion.div>

              <motion.div
                variants={mobileHeroItemVariants}
                className="mt-16 flex items-center gap-5 md:mt-20"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="h-px w-20 bg-linear-to-r from-transparent to-accent/40 md:w-32" />
                <motion.svg
                  width="40"
                  height="20"
                  viewBox="0 0 36 18"
                  fill="none"
                  className="shrink-0 text-accent/55"
                  animate={reduceMotion ? undefined : { scale: [1, 1.04, 1], opacity: [0.58, 0.78, 0.58] }}
                  transition={reduceMotion ? undefined : { duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ willChange: reduceMotion ? "auto" : "transform, opacity" }}
                >
                  <circle cx="12" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="24" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
                </motion.svg>
                <div className="h-px w-20 bg-linear-to-l from-transparent to-accent/40 md:w-32" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0.001, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7, ease }}
              className="relative z-10 flex-none w-full"
              style={{ willChange: "transform, opacity" }}
            >
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
                transition={reduceMotion ? undefined : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-4"
                style={{ willChange: reduceMotion ? "auto" : "transform" }}
              >
                <motion.span
                  animate={reduceMotion ? undefined : { opacity: [0.5, 0.78, 0.5] }}
                  transition={reduceMotion ? undefined : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-xs font-medium uppercase tracking-widest text-text-secondary/60"
                  style={{ willChange: reduceMotion ? "auto" : "opacity" }}
                >
                  {t("scroll_down")}
                </motion.span>
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          scaleY: [0.82, 1.18, 0.82],
                          opacity: [0.28, 0.78, 0.28],
                        }
                  }
                  transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  className="h-16 w-px bg-linear-to-b from-accent/50 to-transparent origin-top"
                  style={{ willChange: reduceMotion ? "auto" : "transform, opacity" }}
                />
              </motion.div>
            </motion.div>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl px-4 relative z-10">
              <AnimatedReveal direction="down" delay={0.1}>
                <h1 className="heading-serif text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-[100px] mb-10 md:mb-16 text-text-primary text-center leading-[0.9]">
                  <span className="hidden md:inline-block whitespace-nowrap">
                    {t("groom_name")} <span className="text-accent italic">&</span> {t("bride_name")}
                  </span>

                  <span className="flex flex-col items-center md:hidden leading-tight">
                    <span>{t("groom_name")}</span>
                    <span className="text-accent text-5xl my-4">&</span>
                    <span>{t("bride_name")}</span>
                  </span>
                </h1>
              </AnimatedReveal>

              <AnimatedReveal direction="up" delay={0.2}>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-16 md:mb-24">
                  <span className="text-sm md:text-base lg:text-lg tracking-widest uppercase text-text-secondary font-medium">
                    {t("date")}
                  </span>
                  <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-accent/40" />
                  <span className="text-sm md:text-base lg:text-lg tracking-widest uppercase text-text-secondary font-medium">
                    {t("location")}
                  </span>
                </div>
              </AnimatedReveal>

              <AnimatedReveal direction="up" delay={0.4}>
                <div className="scale-90 sm:scale-100">
                  <Countdown />
                </div>
              </AnimatedReveal>

              <AnimatedReveal direction="up" delay={0.6} className="mt-16 md:mt-20 flex items-center gap-5">
                <div className="h-px w-20 md:w-32 bg-linear-to-r from-transparent to-accent/40" />
                <svg width="40" height="20" viewBox="0 0 36 18" fill="none" className="shrink-0 text-accent/55">
                  <circle cx="12" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="24" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <div className="h-px w-20 md:w-32 bg-linear-to-l from-transparent to-accent/40" />
              </AnimatedReveal>
            </div>

            <AnimatedReveal direction="up" delay={0.9} className="w-full relative z-10 flex-none">
              <div className="flex flex-col items-center gap-4">
                <span className="text-xs tracking-widest uppercase text-text-secondary/60 font-medium">
                  {t("scroll_down")}
                </span>
                <div className="w-px h-16 bg-linear-to-b from-accent/50 to-transparent" />
              </div>
            </AnimatedReveal>
          </>
        )}
      </div>
    </SectionWrapper>
  );
}
