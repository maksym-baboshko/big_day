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
    <div className="flex items-center justify-center gap-3 my-10 md:my-12">
      <div className="w-10 md:w-14 h-px bg-accent/25" />
      <svg width="12" height="12" viewBox="0 0 12 12" className="text-accent/45 shrink-0" fill="currentColor">
        <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z" />
      </svg>
      <div className="w-10 md:w-14 h-px bg-accent/25" />
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
    <div className={`w-full flex flex-col items-center ${direction === "right" ? "md:pt-16" : ""}`}>
      <div className="relative w-[80%] sm:w-full max-w-70 aspect-3/4 mb-4 md:mb-8 group">
        <div className="absolute inset-0 border border-accent/70 rounded-t-[100px] rounded-b-sm transition-all duration-500 group-hover:border-accent shadow-[0_0_0_0_transparent] group-hover:shadow-[0_0_30px_4px_color-mix(in_srgb,var(--accent)_15%,transparent)] z-10 pointer-events-none" />
        <div className="absolute inset-2 border border-accent/60 rounded-t-[92px] rounded-b-sm z-20 pointer-events-none" />
        <div className="absolute inset-0 rounded-t-[100px] rounded-b-sm overflow-hidden">
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
      <h3 className="heading-serif text-3xl md:text-4xl text-text-primary mb-2 text-center">{name}</h3>
      <span className="text-xs tracking-widest uppercase text-accent font-medium text-center">{role}</span>
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
      <Ornament position="top-left" size="sm" />
      <Ornament position="top-right" size="sm" />
      <Ornament position="bottom-left" size="sm" />
      <Ornament position="bottom-right" size="sm" />

      <SectionHeading subtitle={t("how_we_met_title")}>{t("title")}</SectionHeading>

      <div className="max-w-5xl mx-auto px-4 mt-16 md:mt-24">
        {/* Portraits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 mb-12 md:mb-24 relative">
          {!liteMotion && (
            <>
              <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-accent/8 rounded-full blur-[80px] pointer-events-none -translate-x-1/2" />
              <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-accent/8 rounded-full blur-[80px] pointer-events-none translate-x-1/2" />
            </>
          )}
          <Portrait src="/images/story/groom.jpg" name={t("groom_name")} role={t("groom_bio")} direction="left" delay={0.1} liteMotion={liteMotion} />
          <Portrait src="/images/story/bride.jpg" name={t("bride_name")} role={t("bride_bio")} direction="right" delay={0.2} liteMotion={liteMotion} />
        </div>

        {/* ── Story narrative ── */}
        <div className="max-w-2xl mx-auto">

          {/* Top heart divider */}
          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.05} threshold={0.1}>
            <div className="flex items-center justify-center gap-5 mb-12 md:mb-16">
              <div className="flex-1 h-px bg-accent/30" />
              <div className="text-accent/70 shrink-0 drop-shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_50%,transparent)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className="flex-1 h-px bg-accent/30" />
            </div>
          </AnimatedReveal>

          {/* ── P1 — Drop cap ── */}
          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.1} threshold={0.12}>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed md:leading-loose">
              <span className="float-left heading-serif text-[3.8rem] md:text-[5rem] leading-[0.72] mr-3 md:mr-4 mt-[0.1em] text-accent drop-shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
                {t("story_p1").charAt(0)}
              </span>
              {t("story_p1").slice(1)}
            </p>
          </AnimatedReveal>

          <AnimatedReveal direction="up" threshold={0.4}>
            <StarDivider />
          </AnimatedReveal>

          {/* ── P2 — Bergen meeting ── */}
          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.08} threshold={0.12}>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed md:leading-loose">
              {t("story_p2")}
            </p>
          </AnimatedReveal>

          {/* ── First photo together — cinematic strip ── */}
          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.06} threshold={0.08}>
            <div className="relative w-full aspect-square md:aspect-4/3 rounded-2xl overflow-hidden mt-10 md:mt-12 group">
              <Image
                src="/images/story/our_first_photo.jpg"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                style={{ objectPosition: "center 20%" }}
              />
              {/* dark vignette + bottom gradient for caption */}
              <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]" />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 md:py-5">
                <p className="text-center text-[0.65rem] md:text-xs tracking-[0.22em] uppercase text-white/75 font-medium">
                  {t("photo_caption_first")}
                </p>
              </div>
              {/* Subtle gold border */}
              <div className="absolute inset-0 rounded-2xl border border-accent/20 pointer-events-none" />
            </div>
          </AnimatedReveal>

          <AnimatedReveal direction="up" threshold={0.4}>
            <StarDivider />
          </AnimatedReveal>

          {/* ── P3 — relationship grows ── */}
          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.08} threshold={0.12}>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed md:leading-loose">
              {t("story_p3")}
            </p>
          </AnimatedReveal>

          <AnimatedReveal direction="up" threshold={0.4}>
            <StarDivider />
          </AnimatedReveal>

          {/* ── P4 + heart photo side by side ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-6 md:gap-10 items-center">
            <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.05} threshold={0.12}>
              <p className="text-base md:text-lg text-text-secondary leading-relaxed md:leading-loose">
                {t("story_p4")}
              </p>
            </AnimatedReveal>

            <AnimatedReveal direction={liteMotion ? "up" : "left"} delay={liteMotion ? 0 : 0.15} threshold={0.12}>
              <div className="relative w-full aspect-3/4 md:w-full rounded-2xl overflow-hidden group">
                <Image
                  src="/images/story/heart.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 160px"
                  className="object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-2xl border border-accent/25 pointer-events-none" />
              </div>
            </AnimatedReveal>
          </div>

          {/* ── Closing quote ── */}
          <AnimatedReveal direction="up" delay={liteMotion ? 0 : 0.1} threshold={0.15}>
            <div className="mt-14 md:mt-20 relative">
              {/* Decorative top rule */}
              <div className="flex items-center gap-4 mb-8 md:mb-10">
                <div className="flex-1 h-px bg-accent/20" />
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-1 h-1 rounded-full bg-accent/35" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/55" />
                  <div className="w-1 h-1 rounded-full bg-accent/35" />
                </div>
                <div className="flex-1 h-px bg-accent/20" />
              </div>

              {/* Quote block */}
              <div className="relative text-center px-4 md:px-8">
                {/* Opening quote mark */}
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-0 md:left-2 heading-serif text-[4rem] md:text-[5rem] leading-none text-accent/15 select-none"
                  style={{ lineHeight: 1 }}
                >
                  &ldquo;
                </span>

                <p className="heading-serif-italic text-[1.1rem] sm:text-xl md:text-2xl lg:text-[1.65rem] text-text-primary leading-[1.4] md:leading-relaxed">
                  {t("story_closing")}
                  <span
                    className="inline-block whitespace-nowrap text-[1.2em] align-middle leading-none sm:text-[1.4em]"
                    aria-hidden="true"
                  >
                    {"\u00A0"}💛
                  </span>
                </p>

                {/* Closing quote mark */}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-8 right-0 md:right-2 heading-serif text-[4rem] md:text-[5rem] leading-none text-accent/15 select-none"
                  style={{ lineHeight: 1 }}
                >
                  &rdquo;
                </span>
              </div>

              {/* Decorative bottom rule */}
              <div className="flex items-center justify-center gap-3 mt-12 md:mt-14">
                <div className="w-20 md:w-28 h-px bg-accent/20" />
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-accent/40 shrink-0" fill="currentColor">
                  <path d="M8 0L9.6 6.4L16 8L9.6 9.6L8 16L6.4 9.6L0 8L6.4 6.4L8 0Z" />
                </svg>
                <div className="w-20 md:w-28 h-px bg-accent/20" />
              </div>
            </div>
          </AnimatedReveal>

        </div>
      </div>
    </SectionWrapper>
  );
}
