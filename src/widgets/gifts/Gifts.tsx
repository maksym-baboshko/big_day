"use client";

import { MOTION_EASE, cn, useLiteMotion } from "@/shared/lib";
import { SectionHeading, SectionWrapper } from "@/shared/ui";
import { type Variants, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

const ease = MOTION_EASE;

const GIFT_CARDS = [
  { currency: "nok", amount: "1300", label: "NOK" },
  { currency: "eur", amount: "120", label: "EUR" },
] as const;

const cardListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const desktopCardVariants: Variants = {
  hidden: (index = 0) => ({ opacity: 0.001, x: index === 0 ? -24 : 24, y: 18, scale: 0.985 }),
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0.72, ease } },
};

const mobileCardVariants: Variants = {
  hidden: { opacity: 0.001, x: 0, y: 24, scale: 0.985 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0.52, ease } },
};

function EnvelopeIllustration({
  liteMotion,
  reduceMotion,
}: { liteMotion: boolean; reduceMotion: boolean }) {
  const envelope = (
    <svg
      width="120"
      height="96"
      viewBox="0 0 120 96"
      fill="none"
      className="text-accent drop-shadow-[0_0_24px_rgba(var(--accent-rgb),0.35)]"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="20"
        width="112"
        height="72"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="10"
        y="26"
        width="100"
        height="60"
        rx="4"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.3"
        fill="none"
      />
      <path d="M4 92 L46 56" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M116 92 L74 56" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M4 24 L60 58 L116 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {liteMotion ? (
        <motion.g
          animate={
            reduceMotion
              ? undefined
              : { y: [0, -4, 0], scale: [1, 1.06, 1], opacity: [0.5, 0.8, 0.5] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
          }
          style={{
            transformOrigin: "60px 14px",
            willChange: reduceMotion ? "auto" : "transform, opacity",
          }}
        >
          <circle cx="60" cy="14" r="12" fill="currentColor" fillOpacity="0.08" />
          <path
            d="M60 20 C60 20 54 14 51 14 C48 14 46 16.5 46 19 C46 24 54 30 60 34 C66 30 74 24 74 19 C74 16.5 72 14 69 14 C66 14 60 20 60 20Z"
            fill="currentColor"
            fillOpacity="0.6"
          />
        </motion.g>
      ) : (
        <motion.g
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <circle cx="60" cy="14" r="12" fill="currentColor" fillOpacity="0.08" />
          <path
            d="M60 20 C60 20 54 14 51 14 C48 14 46 16.5 46 19 C46 24 54 30 60 34 C66 30 74 24 74 19 C74 16.5 72 14 69 14 C66 14 60 20 60 20Z"
            fill="currentColor"
            fillOpacity="0.6"
          />
        </motion.g>
      )}
    </svg>
  );

  if (liteMotion && !reduceMotion) {
    return (
      <motion.div
        initial={{ opacity: 0.001, y: 18, rotate: -3, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.65, ease }}
        className="relative flex transform-gpu items-center justify-center"
        style={{ willChange: "transform, opacity" }}
      >
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [0, 1.2, 0, -1.2, 0] }}
          transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="transform-gpu"
          style={{ willChange: "transform" }}
        >
          {envelope}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
      }
      className="relative flex items-center justify-center"
    >
      {envelope}
    </motion.div>
  );
}

export function Gifts() {
  const t = useTranslations("Gifts");
  const liteMotion = useLiteMotion();
  const reduceMotion = useReducedMotion();

  return (
    <SectionWrapper id="gifts" className="relative overflow-hidden py-24">
      {!liteMotion && (
        <>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[140px]" />
          <div className="pointer-events-none absolute left-1/3 top-10 h-72 w-72 rounded-full bg-accent/4 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-10 right-1/3 h-72 w-72 rounded-full bg-accent/4 blur-[100px]" />
        </>
      )}

      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

      <div className="relative z-10 mx-auto mt-16 max-w-3xl px-4">
        {/* Envelope */}
        <motion.div
          initial={{ opacity: 0, y: liteMotion ? 16 : 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: liteMotion ? 0.45 : 0.9, ease }}
          className="mb-12 flex justify-center"
        >
          <EnvelopeIllustration liteMotion={liteMotion} reduceMotion={Boolean(reduceMotion)} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: liteMotion ? 14 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: liteMotion ? 0.45 : 0.8, delay: liteMotion ? 0.04 : 0.1, ease }}
          className="mb-12 text-center text-lg leading-relaxed text-text-secondary md:text-xl"
        >
          {t("intro")}
        </motion.p>

        {/* Amount cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={cardListVariants}
          className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          {GIFT_CARDS.map(({ currency, amount, label }, index) => (
            <motion.div
              key={currency}
              custom={index}
              variants={liteMotion ? mobileCardVariants : desktopCardVariants}
              whileHover={
                liteMotion
                  ? undefined
                  : {
                      y: -8,
                      scale: 1.012,
                      borderColor: "rgba(var(--accent-rgb),0.42)",
                      boxShadow: "0 28px 54px -38px rgba(var(--accent-rgb),0.38)",
                      transition: { duration: 0.28, ease },
                    }
              }
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-accent/24 transform-gpu",
                liteMotion
                  ? "bg-bg-primary/90 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)]"
                  : "bg-bg-primary/58 backdrop-blur-lg transition-[border-color,box-shadow] duration-500",
              )}
              style={{ willChange: "transform, opacity", transformOrigin: "center bottom" }}
            >
              {liteMotion ? (
                <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-accent/35 to-transparent" />
              ) : (
                <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-accent/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              )}
              <div className="pointer-events-none absolute inset-px rounded-[calc(1.5rem-1px)] border border-accent/8" />

              <div className="relative z-10 flex min-h-[14.5rem] flex-col items-center justify-center px-8 py-9 text-center sm:min-h-[15.5rem]">
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-secondary/90">
                  {t("from")}
                </p>
                <p className="heading-serif text-5xl font-bold leading-none text-accent md:text-6xl">
                  {amount}
                </p>
                <p className="mb-3 mt-2 font-cinzel text-lg tracking-widest text-accent">{label}</p>
                <div className="mb-3 h-px w-8 bg-accent/20" />
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary/90">
                  {t("per_guest")}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: liteMotion ? 12 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: liteMotion ? 0.45 : 0.8, delay: liteMotion ? 0.08 : 0.3, ease }}
          className="mb-10 text-center text-base leading-relaxed text-text-secondary/90 md:text-lg"
        >
          {t("details")}
        </motion.p>

        {/* Heart divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: liteMotion ? 0.5 : 0.9, delay: liteMotion ? 0.1 : 0.38, ease }}
          className="mb-10 flex items-center justify-center gap-4"
        >
          <div className="h-px w-20 bg-linear-to-r from-transparent to-accent/30" />
          <svg
            width="14"
            height="12"
            viewBox="0 0 14 12"
            fill="none"
            aria-hidden="true"
            className="text-accent/50"
          >
            <path
              d="M7 11 C7 11 1 6.5 1 3.5 C1 2 2.5 1 4 1 C5.5 1 7 2.5 7 2.5 C7 2.5 8.5 1 10 1 C11.5 1 13 2 13 3.5 C13 6.5 7 11 7 11Z"
              fill="currentColor"
            />
          </svg>
          <div className="h-px w-20 bg-linear-to-l from-transparent to-accent/30" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: liteMotion ? 10 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: liteMotion ? 0.45 : 0.8, delay: liteMotion ? 0.12 : 0.44, ease }}
          className="text-center text-base italic leading-relaxed text-text-secondary/90"
        >
          {t("closing")}
        </motion.p>
      </div>
    </SectionWrapper>
  );
}
