"use client";

import { DRESS_CODE } from "@/shared/config";
import { resolveLocale } from "@/shared/i18n/routing";
import { MOTION_EASE, useLiteMotion } from "@/shared/lib";
import { SectionHeading, SectionWrapper } from "@/shared/ui";
import { type Variants, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";

const ease = MOTION_EASE;

const swatchGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const desktopSwatchVariants: Variants = {
  hidden: { opacity: 0.001, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const mobileSwatchVariants: Variants = {
  hidden: { opacity: 0.001, y: 20, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

function ColorSwatch({
  hex,
  name,
  liteMotion,
}: { hex: string; name: string; liteMotion: boolean }) {
  return (
    <motion.div
      variants={liteMotion ? mobileSwatchVariants : desktopSwatchVariants}
      className="group flex flex-col transform-gpu"
      style={{ willChange: "transform, opacity" }}
    >
      <div
        className={
          liteMotion
            ? "relative aspect-3/4 overflow-hidden rounded-2xl border border-white/8 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.38)]"
            : "relative aspect-3/4 cursor-pointer overflow-hidden rounded-2xl shadow-md transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl md:rounded-3xl"
        }
      >
        <div
          className={
            liteMotion
              ? "absolute inset-0"
              : "absolute inset-0 transition-transform duration-700 group-hover:scale-105"
          }
          style={{ backgroundColor: hex }}
        />
        {/* Shine overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)",
          }}
        />
        {liteMotion ? (
          <motion.div
            initial={{ opacity: 0, x: "-115%" }}
            whileInView={{ opacity: [0, 0.16, 0], x: ["-115%", "20%", "135%"] }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.9, delay: 0.12, ease }}
            className="pointer-events-none absolute inset-y-0 left-0 w-[34%]"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 52%, rgba(255,255,255,0) 100%)",
            }}
          />
        ) : (
          <>
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col items-center justify-end bg-linear-to-t from-black/50 to-transparent pb-4 pt-10 transition-transform duration-500 group-hover:translate-y-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
                {hex}
              </span>
            </div>
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:rounded-3xl"
              style={{ boxShadow: `inset 0 0 0 1px ${hex}80, 0 20px 60px ${hex}40` }}
            />
          </>
        )}
      </div>
      <p
        className={
          liteMotion
            ? "mt-3 px-1 text-center text-xs font-medium leading-tight text-text-secondary/90"
            : "mt-3 px-1 text-center text-xs font-medium leading-tight text-text-secondary/90 transition-colors duration-300 group-hover:text-accent md:text-sm"
        }
      >
        {name}
      </p>
    </motion.div>
  );
}

function GroupHeading({
  title,
  note,
  direction,
  delay,
  liteMotion,
}: {
  title: string;
  note: string;
  direction: "left" | "right";
  delay: number;
  liteMotion: boolean;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: direction === "left" ? (liteMotion ? -12 : -24) : liteMotion ? 12 : 24,
      }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: liteMotion ? 0.42 : 0.75,
        delay: liteMotion ? Math.min(delay, 0.08) : delay,
        ease,
      }}
      className="mb-8 text-center md:mb-10 md:text-left"
    >
      <h3 className="heading-serif mb-2 text-2xl text-accent md:text-3xl">{title}</h3>
      <p className="text-sm italic tracking-wide text-text-secondary/90">{note}</p>
    </motion.div>
  );
}

export function DressCode() {
  const t = useTranslations("DressCode");
  const locale = resolveLocale(useLocale());
  const liteMotion = useLiteMotion();

  const allColors = [...DRESS_CODE.ladies.colors, ...DRESS_CODE.gentlemen.colors];
  const uniqueStripColors = allColors.filter(
    (color, index, colors) => colors.findIndex((entry) => entry.hex === color.hex) === index,
  );

  return (
    <SectionWrapper id="dress-code" className="relative overflow-hidden py-24">
      {!liteMotion && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-150 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/4 blur-[150px]" />
      )}

      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

      {/* Color strip */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: liteMotion ? 0.7 : 1.3, delay: liteMotion ? 0.04 : 0.15, ease }}
        style={{ transformOrigin: "left" }}
        className="mx-auto mt-10 flex h-0.75 max-w-xl overflow-hidden rounded-full"
      >
        {uniqueStripColors.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: color strip uses index
          <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
        ))}
      </motion.div>

      <div className="relative z-10 mx-auto mt-16 max-w-5xl px-4 md:mt-20">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:gap-24">
          {/* Ladies */}
          <div>
            <GroupHeading
              title={t("ladies_title")}
              note={t("ladies_note")}
              direction="left"
              delay={0.2}
              liteMotion={liteMotion}
            />
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.18, margin: "-40px" }}
              variants={swatchGridVariants}
              className="grid grid-cols-2 gap-4 md:gap-5"
            >
              {DRESS_CODE.ladies.colors.map((color) => (
                <ColorSwatch
                  key={color.hex}
                  hex={color.hex}
                  name={color.name[locale]}
                  liteMotion={liteMotion}
                />
              ))}
            </motion.div>
          </div>

          {/* Gentlemen */}
          <div>
            <GroupHeading
              title={t("gentlemen_title")}
              note={t("gentlemen_note")}
              direction="right"
              delay={0.35}
              liteMotion={liteMotion}
            />
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.18, margin: "-40px" }}
              variants={swatchGridVariants}
              className="grid grid-cols-2 gap-4 md:gap-5"
            >
              {DRESS_CODE.gentlemen.colors.map((color) => (
                <ColorSwatch
                  key={color.hex}
                  hex={color.hex}
                  name={color.name[locale]}
                  liteMotion={liteMotion}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
