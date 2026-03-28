"use client";

import { Countdown } from "@/features/countdown";
import { VENUE, WEDDING_DATE_ROMAN } from "@/shared/config";
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

const heroSectionGapClass = "mb-[clamp(1.75rem,5.8vh,4rem)] md:mb-24";

function HeroMetaContent() {
  return (
    <div
      className={`${heroSectionGapClass} flex flex-col items-center gap-[clamp(1rem,3vh,1.75rem)] text-center`}
    >
      <div className="flex items-center gap-[clamp(1rem,5vw,1.75rem)] text-accent/72">
        <div className="h-px w-[clamp(4.5rem,18vw,6.5rem)] bg-linear-to-r from-transparent to-accent/40" />
        <svg
          width="40"
          height="20"
          viewBox="0 0 36 18"
          aria-hidden="true"
          fill="none"
          className="h-[clamp(1rem,4.5vw,1.25rem)] w-[clamp(2rem,10vw,2.5rem)] shrink-0"
        >
          <circle cx="12" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="24" cy="9" r="8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <div className="h-px w-[clamp(4.5rem,18vw,6.5rem)] bg-linear-to-l from-transparent to-accent/40" />
      </div>

      <div className="flex flex-col items-center gap-[clamp(0.5rem,1.75vh,0.85rem)]">
        <span className="font-cinzel text-[0.95rem] font-semibold uppercase tracking-[0.34em] text-accent/88 sm:text-[1.02rem] md:text-[1.18rem] lg:text-[1.3rem]">
          {WEDDING_DATE_ROMAN}
        </span>
        <span className="whitespace-nowrap font-cinzel text-[0.75rem] font-normal uppercase tracking-[0.075em] text-text-secondary/90 sm:text-[1rem] sm:tracking-[0.16em] md:text-[1.08rem] lg:text-[1.18rem]">
          {`${VENUE.name} · ${VENUE.locationShort}`}
        </span>
      </div>
    </div>
  );
}

interface InvitationHeroIntroProps {
  countdownNowMs?: number;
}

export function InvitationHeroIntro({ countdownNowMs }: InvitationHeroIntroProps) {
  const t = useTranslations("Hero");
  const liteMotion = useLiteMotion();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center px-6 sm:px-4">
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <h1
            className={`heading-serif ${heroSectionGapClass} text-center text-[clamp(3.375rem,13.8vw,4.4rem)] leading-[0.88] text-text-primary sm:text-7xl md:text-7xl lg:text-8xl xl:text-[100px]`}
          >
            <span className="hidden whitespace-nowrap md:inline-block">
              {t("groom_name")} <span className="text-accent italic">&</span> {t("bride_name")}
            </span>
            <span className="grid justify-items-center gap-[clamp(0.45rem,1.8vh,0.9rem)] leading-[0.88] md:hidden">
              <span>{t("groom_name")}</span>
              <span className="flex items-end justify-center gap-[clamp(0.75rem,4vw,1.35rem)]">
                <span className="shrink-0 translate-y-[0.06em] text-[clamp(3rem,12.9vw,3.9rem)] leading-none text-accent">
                  &
                </span>
                <span>{t("bride_name")}</span>
              </span>
            </span>
          </h1>

          <HeroMetaContent />

          <div className="origin-top scale-[0.84] sm:scale-100">
            <Countdown nowMs={countdownNowMs} />
          </div>
        </div>

        <div className="relative z-10 w-full flex-none">
          <div className="flex flex-col items-center gap-[clamp(0.5rem,1.5vh,1rem)]">
            <span className="text-xs font-medium uppercase tracking-widest text-text-secondary/90">
              {t("scroll_down")}
            </span>
            <div className="h-[clamp(2.25rem,7vh,4rem)] w-px bg-linear-to-b from-accent/50 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (liteMotion) {
    return (
      <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center px-6 sm:px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="flex w-full flex-1 flex-col items-center justify-center"
        >
          <motion.h1
            variants={heroTitleVariants}
            className={`heading-serif ${heroSectionGapClass} text-center text-[clamp(3.375rem,13.8vw,4.4rem)] leading-[0.88] text-text-primary sm:text-7xl md:text-7xl lg:text-8xl xl:text-[100px]`}
            style={{ willChange: "transform, opacity" }}
          >
            <span className="hidden whitespace-nowrap md:inline-block">
              {t("groom_name")} <span className="text-accent italic">&</span> {t("bride_name")}
            </span>
            <span className="grid justify-items-center gap-[clamp(0.45rem,1.8vh,0.9rem)] leading-[0.88] md:hidden">
              <span>{t("groom_name")}</span>
              <span className="flex items-end justify-center gap-[clamp(0.75rem,4vw,1.35rem)]">
                <span className="shrink-0 translate-y-[0.06em] text-[clamp(3rem,12.9vw,3.9rem)] leading-none text-accent">
                  &
                </span>
                <span>{t("bride_name")}</span>
              </span>
            </span>
          </motion.h1>

          <motion.div
            variants={heroItemVariants}
            className="flex justify-center"
            style={{ willChange: "transform, opacity" }}
          >
            <HeroMetaContent />
          </motion.div>

          <motion.div
            variants={heroItemVariants}
            className="origin-top scale-[0.84] sm:scale-100"
            style={{ willChange: "transform, opacity" }}
          >
            <Countdown nowMs={countdownNowMs} />
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
            className="flex flex-col items-center gap-[clamp(0.5rem,1.5vh,1rem)]"
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
              className="h-[clamp(2.25rem,7vh,4rem)] w-px origin-top bg-linear-to-b from-accent/50 to-transparent"
              style={{ willChange: reduceMotion ? "auto" : "transform, opacity" }}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center px-6 sm:px-4">
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <PageEnterReveal direction="down" delay={0.1}>
          <h1
            className={`heading-serif ${heroSectionGapClass} text-center text-[clamp(3.375rem,13.8vw,4.4rem)] leading-[0.88] text-text-primary sm:text-7xl md:text-7xl lg:text-8xl xl:text-[100px]`}
          >
            <span className="hidden whitespace-nowrap md:inline-block">
              {t("groom_name")} <span className="text-accent italic">&</span> {t("bride_name")}
            </span>
            <span className="grid justify-items-center gap-[clamp(0.45rem,1.8vh,0.9rem)] leading-[0.88] md:hidden">
              <span>{t("groom_name")}</span>
              <span className="flex items-end justify-center gap-[clamp(0.75rem,4vw,1.35rem)]">
                <span className="shrink-0 translate-y-[0.06em] text-[clamp(3rem,12.9vw,3.9rem)] leading-none text-accent">
                  &
                </span>
                <span>{t("bride_name")}</span>
              </span>
            </span>
          </h1>
        </PageEnterReveal>

        <PageEnterReveal direction="up" delay={0.2}>
          <HeroMetaContent />
        </PageEnterReveal>

        <PageEnterReveal direction="up" delay={0.4}>
          <div className="origin-top scale-[0.84] sm:scale-100">
            <Countdown nowMs={countdownNowMs} />
          </div>
        </PageEnterReveal>
      </div>

      <PageEnterReveal direction="up" delay={0.9} className="relative z-10 w-full flex-none">
        <div className="flex flex-col items-center gap-[clamp(0.5rem,1.5vh,1rem)]">
          <span className="text-xs font-medium uppercase tracking-widest text-text-secondary/90">
            {t("scroll_down")}
          </span>
          <div className="h-[clamp(2.25rem,7vh,4rem)] w-px bg-linear-to-b from-accent/50 to-transparent" />
        </div>
      </PageEnterReveal>
    </div>
  );
}
