"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { SectionWrapper, SectionHeading, Ornament } from "@/shared/ui";
import { DRESS_CODE } from "@/shared/config";
import { useLiteMotion } from "@/shared/lib";

const ease = [0.22, 1, 0.36, 1] as const;
const swatchGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const desktopSwatchVariants: Variants = {
  hidden: {
    opacity: 0.001,
    y: 48,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease,
    },
  },
};

const mobileSwatchVariants: Variants = {
  hidden: {
    opacity: 0.001,
    y: 20,
    scale: 0.985,
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

function ColorSwatch({
  hex,
  name,
  liteMotion,
}: {
  hex: string;
  name: string;
  liteMotion: boolean;
}) {
  const content = (
    <>
      <div
        className={
          liteMotion
            ? "relative aspect-3/4 overflow-hidden rounded-2xl border border-white/8 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.38)]"
            : "relative aspect-3/4 cursor-pointer overflow-hidden rounded-2xl shadow-md transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl md:rounded-3xl"
        }
      >
        <div
          className={liteMotion ? "absolute inset-0" : "absolute inset-0 transition-transform duration-700 group-hover:scale-105"}
          style={{ backgroundColor: hex }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)",
          }}
        />
        {liteMotion ? (
          <>
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
          </>
        ) : (
          <>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-4 pt-10 bg-linear-to-t from-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <span className="text-white/80 text-[10px] uppercase tracking-[0.2em] font-mono">
                {hex}
              </span>
            </div>
            <div
              className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100 md:rounded-3xl"
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
    </>
  );

  return (
    <motion.div
      variants={liteMotion ? mobileSwatchVariants : desktopSwatchVariants}
      className="group flex flex-col transform-gpu"
      style={{ willChange: "transform, opacity" }}
    >
      {content}
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
  const content = (
    <>
      <h3 className="heading-serif text-2xl md:text-3xl text-accent mb-2">
        {title}
      </h3>
      <p className="text-sm italic tracking-wide text-text-secondary/90">{note}</p>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: direction === "left" ? (liteMotion ? -12 : -24) : (liteMotion ? 12 : 24) }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: liteMotion ? 0.42 : 0.75, delay: liteMotion ? Math.min(delay, 0.08) : delay, ease }}
      className="mb-8 md:mb-10 text-center md:text-left"
    >
      {content}
    </motion.div>
  );
}

export function DressCode() {
  const t = useTranslations("DressCode");
  const locale = useLocale() as "uk" | "en";
  const liteMotion = useLiteMotion();
  const allColors = [...DRESS_CODE.ladies.colors, ...DRESS_CODE.gentlemen.colors];
  const uniqueStripColors = allColors.filter(
    (color, index, colors) => colors.findIndex((entry) => entry.hex === color.hex) === index
  );

  return (
    <SectionWrapper id="dress-code" className="py-24 relative overflow-hidden">
      <Ornament position="top-right" size="sm" className="opacity-40" />
      <Ornament position="bottom-left" size="sm" className="opacity-40" />

      {!liteMotion && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-150 bg-accent/4 rounded-full blur-[150px] pointer-events-none" />
      )}

      <SectionHeading subtitle={t("subtitle")}>
        {t("title")}
      </SectionHeading>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: liteMotion ? 0.7 : 1.3, delay: liteMotion ? 0.04 : 0.15, ease }}
        style={{ transformOrigin: "left" }}
        className="max-w-xl mx-auto mt-10 h-0.75 flex rounded-full overflow-hidden"
      >
        {uniqueStripColors.map((c, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
        ))}
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 mt-16 md:mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">

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
              {DRESS_CODE.ladies.colors.map((color, i) => (
                <ColorSwatch
                  key={i}
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
              {DRESS_CODE.gentlemen.colors.map((color, i) => (
                <ColorSwatch
                  key={i}
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
