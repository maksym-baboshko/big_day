"use client";

import { type Variants, motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { MOTION_EASE, useLiteMotion } from "@/shared/lib";
import { AnimatedReveal, SectionHeading, SectionWrapper } from "@/shared/ui";

const ease = MOTION_EASE;

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
    transition: { duration: 0.56, ease },
  },
};

const mobileImageVariants: Variants = {
  hidden: { scale: 1.045, opacity: 0.001 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.72, ease },
  },
};

function StarDivider() {
  return (
    <div className="my-10 flex items-center justify-center gap-3 md:my-12">
      <div className="h-px w-10 bg-accent/25 md:w-14" />
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className="shrink-0 text-accent/45"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z" />
      </svg>
      <div className="h-px w-10 bg-accent/25 md:w-14" />
    </div>
  );
}

function Portrait({
  src,
  name,
  role,
  direction,
  delay,
  liteMotion,
}: {
  src: string;
  name: string;
  role: string;
  direction: "left" | "right";
  delay: number;
  liteMotion: boolean;
}) {
  const content = (
    <div className={`flex w-full flex-col items-center ${direction === "right" ? "md:pt-16" : ""}`}>
      <div className="group relative mb-4 aspect-3/4 w-[80%] max-w-70 sm:w-full md:mb-8">
        <div className="pointer-events-none absolute inset-0 z-10 rounded-t-[100px] rounded-b-sm border border-accent/70 shadow-[0_0_0_0_transparent] transition-all duration-500 group-hover:border-accent group-hover:shadow-[0_0_30px_4px_color-mix(in_srgb,var(--accent)_15%,transparent)]" />
        <div className="pointer-events-none absolute inset-2 z-20 rounded-t-[92px] rounded-b-sm border border-accent/60" />
        <div className="absolute inset-0 overflow-hidden rounded-t-[100px] rounded-b-sm">
          {liteMotion ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={mobileImageVariants}
              className="relative h-full w-full transform-gpu"
              style={{ willChange: "transform, opacity" }}
            >
              <Image src={src} alt={name} fill sizes="280px" className="object-cover" />
            </motion.div>
          ) : (
            <Image
              src={src}
              alt={name}
              fill
              sizes="280px"
              className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
            />
          )}
        </div>
      </div>
      <h3 className="heading-serif mb-2 text-center text-3xl text-text-primary md:text-4xl">
        {name}
      </h3>
      <span className="text-center text-xs font-medium uppercase tracking-widest text-accent">
        {role}
      </span>
    </div>
  );

  if (liteMotion) {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={mobilePortraitVariants}
        custom={direction}
        className="w-full"
        style={{ willChange: "transform, opacity" }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <AnimatedReveal direction="up" delay={delay} className="w-full">
      {content}
    </AnimatedReveal>
  );
}

export function OurStory() {
  const t = useTranslations("OurStory");
  const liteMotion = useLiteMotion();

  return (
    <SectionWrapper id="our-story" className="relative overflow-hidden py-24">
      <SectionHeading subtitle={t("how_we_met_title")}>{t("title")}</SectionHeading>

      <div className="mx-auto mt-16 max-w-5xl px-4 md:mt-24">
        <div className="relative mb-12 grid grid-cols-1 gap-8 md:mb-24 md:grid-cols-2 md:gap-16 lg:gap-24">
          {!liteMotion && (
            <>
              <div className="pointer-events-none absolute left-1/4 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/8 blur-[80px]" />
              <div className="pointer-events-none absolute right-1/4 top-1/2 h-72 w-72 translate-x-1/2 rounded-full bg-accent/8 blur-[80px]" />
            </>
          )}
          <Portrait
            src="/images/story/groom.jpg"
            name={t("groom_name")}
            role={t("groom_bio")}
            direction="left"
            delay={0.1}
            liteMotion={liteMotion}
          />
          <Portrait
            src="/images/story/bride.jpg"
            name={t("bride_name")}
            role={t("bride_bio")}
            direction="right"
            delay={0.2}
            liteMotion={liteMotion}
          />
        </div>

        <div className="mx-auto max-w-2xl">
          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.05} threshold={0.1}>
            <div className="mb-12 flex items-center justify-center gap-5 md:mb-16">
              <div className="h-px flex-1 bg-accent/30" />
              <div className="shrink-0 text-accent/70 drop-shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_50%,transparent)]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className="h-px flex-1 bg-accent/30" />
            </div>
          </AnimatedReveal>

          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.1} threshold={0.12}>
            <p className="text-base leading-relaxed text-text-secondary md:text-lg md:leading-loose">
              <span className="heading-serif float-left mr-3 mt-[0.1em] text-[3.8rem] leading-[0.72] text-accent drop-shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] md:mr-4 md:text-[5rem]">
                {t("story_p1").charAt(0)}
              </span>
              {t("story_p1").slice(1)}
            </p>
          </AnimatedReveal>

          <AnimatedReveal direction="up" threshold={0.4}>
            <StarDivider />
          </AnimatedReveal>

          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.08} threshold={0.12}>
            <p className="text-base leading-relaxed text-text-secondary md:text-lg md:leading-loose">
              {t("story_p2")}
            </p>
          </AnimatedReveal>

          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.06} threshold={0.08}>
            <div className="group relative mt-10 aspect-square w-full overflow-hidden rounded-2xl md:mt-12 md:aspect-4/3">
              <Image
                src="/images/story/our_first_photo.jpg"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                style={{ objectPosition: "center 20%" }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]" />
              <div className="absolute inset-0 rounded-2xl border border-accent/20" />
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 md:py-5">
                <p className="text-center text-[0.65rem] font-medium uppercase tracking-[0.22em] text-white/75 md:text-xs">
                  {t("photo_caption_first")}
                </p>
              </div>
            </div>
          </AnimatedReveal>

          <AnimatedReveal direction="up" threshold={0.4}>
            <StarDivider />
          </AnimatedReveal>

          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.08} threshold={0.12}>
            <p className="text-base leading-relaxed text-text-secondary md:text-lg md:leading-loose">
              {t("story_p3")}
            </p>
          </AnimatedReveal>

          <AnimatedReveal direction="up" threshold={0.4}>
            <StarDivider />
          </AnimatedReveal>

          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_160px] md:gap-10">
            <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.05} threshold={0.12}>
              <p className="text-base leading-relaxed text-text-secondary md:text-lg md:leading-loose">
                {t("story_p4")}
              </p>
            </AnimatedReveal>

            <AnimatedReveal
              direction={liteMotion ? "up" : "left"}
              delay={liteMotion ? 0 : 0.15}
              threshold={0.12}
            >
              <div className="group relative aspect-3/4 w-full overflow-hidden rounded-2xl md:w-full">
                <Image
                  src="/images/story/heart.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 160px"
                  className="object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-2xl border border-accent/25" />
              </div>
            </AnimatedReveal>
          </div>

          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.1} threshold={0.15}>
            <div className="relative mt-14 md:mt-20">
              <div className="mb-8 flex items-center gap-4 md:mb-10">
                <div className="h-px flex-1 bg-accent/20" />
                <div className="flex shrink-0 gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-accent/35" />
                  <div className="h-1.5 w-1.5 rounded-full bg-accent/55" />
                  <div className="h-1 w-1 rounded-full bg-accent/35" />
                </div>
                <div className="h-px flex-1 bg-accent/20" />
              </div>

              <div className="relative px-4 text-center md:px-8">
                <span
                  aria-hidden="true"
                  className="heading-serif pointer-events-none absolute left-0 -top-2 select-none text-[4rem] leading-none text-accent/15 md:left-2 md:text-[5rem]"
                  style={{ lineHeight: 1 }}
                >
                  &ldquo;
                </span>

                <p className="heading-serif-italic text-[1.1rem] leading-[1.4] text-text-primary sm:text-xl md:text-2xl md:leading-relaxed lg:text-[1.65rem]">
                  {t("story_closing")}
                  <span
                    className="inline-block whitespace-nowrap align-middle text-[1.2em] leading-none sm:text-[1.4em]"
                    aria-hidden="true"
                  >
                    {"\u00A0"}💛
                  </span>
                </p>

                <span
                  aria-hidden="true"
                  className="heading-serif pointer-events-none absolute bottom-[-2rem] right-0 select-none text-[4rem] leading-none text-accent/15 md:right-2 md:text-[5rem]"
                  style={{ lineHeight: 1 }}
                >
                  &rdquo;
                </span>
              </div>

              <div className="mt-12 flex items-center justify-center gap-3 md:mt-14">
                <div className="h-px w-20 bg-accent/20 md:w-28" />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="shrink-0 text-accent/40"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 0L9.6 6.4L16 8L9.6 9.6L8 16L6.4 9.6L0 8L6.4 6.4L8 0Z" />
                </svg>
                <div className="h-px w-20 bg-accent/20 md:w-28" />
              </div>
            </div>
          </AnimatedReveal>
        </div>
      </div>
    </SectionWrapper>
  );
}
