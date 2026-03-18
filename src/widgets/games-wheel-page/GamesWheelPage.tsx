"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/shared/i18n/navigation";
import { PlayerSessionCard, usePlayerSession } from "@/features/game-session";
import { WheelOfFortuneGame } from "@/features/wheel-of-fortune";
import { getGameBySlug, type SupportedLocale } from "@/shared/config";
import { GamesHeroSection } from "@/widgets/games-hero";
import { AnimatedReveal, SectionWrapper } from "@/shared/ui";

const wheelGame = getGameBySlug("wheel-of-fortune");

export function GamesWheelPage() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("WheelOfFortune");
  const tCommon = useTranslations("GamesCommon");
  const {
    session,
    isHydrating,
    isSaving,
    errorCode,
    registerPlayer,
    clearPlayer,
    updatePlayerSnapshot,
  } = usePlayerSession();

  if (!wheelGame) return null;

  return (
    <>
      {/* ══════ HERO ══════ */}
      <SectionWrapper noFade noPadding className="relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <GamesHeroSection
          title={wheelGame.title[locale]}
          description={t("page_description")}
          chips={[t("chip_mix"), t("chip_random"), t("chip_score")]}
          rightSlot={
            <PlayerSessionCard
              session={session}
              isHydrating={isHydrating}
              isSaving={isSaving}
              errorCode={errorCode}
              onSave={registerPlayer}
              onClear={clearPlayer}
            />
          }
        />
      </SectionWrapper>

      {/* ══════ GAME AREA ══════ */}
      <SectionWrapper noPadding noFade className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
          {/* Breadcrumbs */}
          <AnimatedReveal direction="up" delay={0.06}>
          <nav
            aria-label={tCommon("games_navigation")}
            className="mb-6 ml-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.26em] md:text-xs"
          >
            <Link
              href="/"
              className="text-text-secondary/35 transition-colors duration-300 hover:text-accent"
            >
              {tCommon("home_nav")}
            </Link>
            <span className="text-accent/25">/</span>
            <Link
              href="/games"
              className="text-text-secondary/35 transition-colors duration-300 hover:text-accent"
            >
              {tCommon("games_nav")}
            </Link>
            <span className="text-accent/25">/</span>
            <span className="text-text-secondary/80">{wheelGame.title[locale]}</span>
          </nav>
          </AnimatedReveal>
          {session ? (
            <WheelOfFortuneGame onPlayerUpdate={updatePlayerSnapshot} />
          ) : (
            <AnimatedReveal direction="up" delay={0.14}>
              <motion.div
                className="group relative overflow-hidden rounded-3xl border border-accent/12 p-8 md:p-12"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--bg-secondary)), var(--bg-primary))",
                }}
              >
                {/* Watermark */}
                <span
                  className="pointer-events-none absolute -right-3 -top-6 select-none font-cinzel text-[10rem] leading-none text-accent/4 transition-colors duration-700 group-hover:text-accent/7 md:text-[14rem]"
                  aria-hidden="true"
                >
                  ?
                </span>

                <div className="relative z-10 max-w-lg">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/8">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 12,
                        ease: "linear",
                        repeat: Infinity,
                      }}
                      className="text-2xl"
                      aria-hidden="true"
                    >
                      ◎
                    </motion.span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.38em] text-accent">
                    {t("locked_label")}
                  </p>
                  <h2 className="heading-serif mt-3 text-3xl text-text-primary md:text-4xl">
                    {t("locked_title")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-base">
                    {t("locked_description")}
                  </p>
                </div>
              </motion.div>
            </AnimatedReveal>
          )}
        </div>
      </SectionWrapper>
    </>
  );
}
