"use client";

import { Countdown } from "@/features/countdown";
import { MOTION_EASE, useLiteMotion } from "@/shared/lib";
import { PageEnterReveal } from "@/shared/ui";
import { type Variants, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

const ease = MOTION_EASE;

const heroVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0.001, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
};

const heroTitleVariants: Variants = {
  hidden: { opacity: 0.001, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.86, ease },
  },
};

export function InvitationHeroIntro() {
  const t = useTranslations("Hero");
  const liteMotion = useLiteMotion();
  const reduceMotion = useReducedMotion();

  if (liteMotion) {
    return (
      <>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4"
        >
          <motion.h1
            variants={heroTitleVariants}
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
                  reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.88, 1, 0.88] }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
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
            variants={heroItemVariants}
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
            variants={heroItemVariants}
            className="scale-90 sm:scale-100"
            style={{ willChange: "transform, opacity" }}
          >
            <Countdown />
          </motion.div>

          <motion.div
            variants={heroItemVariants}
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
              aria-hidden="true"
              animate={
                reduceMotion ? undefined : { scale: [1, 1.04, 1], opacity: [0.58, 0.78, 0.58] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 5.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
              }
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
          className="relative z-10 w-full flex-none"
          style={{ willChange: "transform, opacity" }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
            }
            className="flex flex-col items-center gap-4"
            style={{ willChange: reduceMotion ? "auto" : "transform" }}
          >
            <motion.span
              animate={reduceMotion ? undefined : { opacity: [0.88, 1, 0.88] }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
              }
              className="text-xs font-medium uppercase tracking-widest text-text-secondary/90"
              style={{ willChange: reduceMotion ? "auto" : "opacity" }}
            >
              {t("scroll_down")}
            </motion.span>
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { scaleY: [0.82, 1.18, 0.82], opacity: [0.28, 0.78, 0.28] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
              }
              className="h-16 w-px origin-top bg-linear-to-b from-accent/50 to-transparent"
              style={{ willChange: reduceMotion ? "auto" : "transform, opacity" }}
            />
          </motion.div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4">
        <PageEnterReveal direction="down" delay={0.1}>
          <h1 className="heading-serif mb-10 text-center text-6xl leading-[0.9] text-text-primary sm:text-7xl md:mb-16 md:text-7xl lg:text-8xl xl:text-[100px]">
            <span className="hidden whitespace-nowrap md:inline-block">
              {t("groom_name")} <span className="text-accent italic">&</span> {t("bride_name")}
            </span>
            <span className="flex flex-col items-center leading-tight md:hidden">
              <span>{t("groom_name")}</span>
              <span className="my-4 text-5xl text-accent">&</span>
              <span>{t("bride_name")}</span>
            </span>
          </h1>
        </PageEnterReveal>

        <PageEnterReveal direction="up" delay={0.2}>
          <div className="mb-16 flex flex-col items-center justify-center gap-4 md:mb-24 md:flex-row md:gap-8">
            <span className="text-sm font-medium uppercase tracking-widest text-text-secondary md:text-base lg:text-lg">
              {t("date")}
            </span>
            <span className="hidden h-1.5 w-1.5 rounded-full bg-accent/40 md:inline-block" />
            <span className="text-sm font-medium uppercase tracking-widest text-text-secondary md:text-base lg:text-lg">
              {t("location")}
            </span>
          </div>
        </PageEnterReveal>

        <PageEnterReveal direction="up" delay={0.4}>
          <div className="scale-90 sm:scale-100">
            <Countdown />
          </div>
        </PageEnterReveal>

        <PageEnterReveal
          direction="up"
          delay={0.6}
          className="mt-16 flex items-center gap-5 md:mt-20"
        >
          <div className="h-px w-20 bg-linear-to-r from-transparent to-accent/40 md:w-32" />
          <svg
            width="40"
            height="20"
            viewBox="0 0 36 18"
            fill="none"
            className="shrink-0 text-accent/55"
            aria-hidden="true"
          >
            <circle cx="12" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="24" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          <div className="h-px w-20 bg-linear-to-l from-transparent to-accent/40 md:w-32" />
        </PageEnterReveal>
      </div>

      <PageEnterReveal direction="up" delay={0.9} className="relative z-10 w-full flex-none">
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs font-medium uppercase tracking-widest text-text-secondary/90">
            {t("scroll_down")}
          </span>
          <div className="h-16 w-px bg-linear-to-b from-accent/50 to-transparent" />
        </div>
      </PageEnterReveal>
    </>
  );
}
