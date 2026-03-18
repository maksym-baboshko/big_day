"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { PlayerSessionCard, usePlayerSession } from "@/features/game-session";
import {
  GAMES,
  getPlayableGames,
  type GameCatalogItem,
  type SupportedLocale,
} from "@/shared/config";
import { GamesHeroSection } from "@/widgets/games-hero";
import { AnimatedReveal, Button } from "@/shared/ui";

/* ═══════════════════════════════════════════════════
   Coming-soon game card
   ═══════════════════════════════════════════════════ */

function ComingSoonCard({
  game,
  index,
  locale,
}: {
  game: GameCatalogItem;
  index: number;
  locale: SupportedLocale;
}) {
  const tCommon = useTranslations("GamesCommon");
  const num = (index + 1).toString().padStart(2, "0");

  return (
    <AnimatedReveal direction="up" delay={Math.min(index * 0.07, 0.28)}>
      <div
        className="group relative flex h-full flex-col overflow-hidden rounded-4xl border border-accent/10 bg-linear-to-br from-accent/5 via-transparent to-accent/4 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-accent/22 hover:shadow-[0_32px_80px_-36px_rgba(0,0,0,0.35)] md:p-7"
      >
        {/* Giant watermark number */}
        <span
          className="pointer-events-none absolute -right-2 -top-5 select-none font-cinzel text-[7.5rem] leading-none text-accent/5 transition-colors duration-700 group-hover:text-accent/10 md:text-[9rem]"
          aria-hidden="true"
        >
          {num}
        </span>

        {/* Hover glow orb */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/0 blur-3xl transition-all duration-700 group-hover:bg-accent/6" />

        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <span className="font-cinzel text-sm tracking-wider text-accent/35">
              {num}
            </span>
            <span className="rounded-full border border-accent/14 bg-accent/8 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.28em] text-accent">
              {tCommon("coming_soon_badge")}
            </span>
          </div>

          <h3 className="heading-serif mt-5 text-xl text-text-primary md:text-2xl">
            {game.title[locale]}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
            {game.description[locale]}
          </p>

          <div className="mt-5">
            <span className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/50">
              {tCommon("coming_soon_cta")}
            </span>
          </div>
        </div>
      </div>
    </AnimatedReveal>
  );
}

/* ═══════════════════════════════════════════════════
   Live game card (for extra live games beyond featured)
   ═══════════════════════════════════════════════════ */

function LiveGameCard({
  game,
  index,
  locale,
}: {
  game: GameCatalogItem;
  index: number;
  locale: SupportedLocale;
}) {
  const tCommon = useTranslations("GamesCommon");
  const num = (index + 1).toString().padStart(2, "0");

  return (
    <AnimatedReveal direction="up" delay={Math.min(index * 0.07, 0.28)}>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-4xl border border-accent/10 bg-linear-to-br from-accent/5 via-transparent to-accent/4 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-accent/22 hover:shadow-[0_32px_80px_-36px_rgba(0,0,0,0.35)] md:p-7">
        <span
          className="pointer-events-none absolute -right-2 -top-5 select-none font-cinzel text-[7.5rem] leading-none text-accent/5 transition-colors duration-700 group-hover:text-accent/10 md:text-[9rem]"
          aria-hidden="true"
        >
          {num}
        </span>

        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <span className="font-cinzel text-sm tracking-wider text-accent/35">
              {num}
            </span>
            <span className="rounded-full border border-accent/16 bg-accent/8 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.28em] text-accent">
              {tCommon("live_badge")}
            </span>
          </div>

          <h3 className="heading-serif mt-5 text-2xl text-text-primary md:text-3xl">
            {game.title[locale]}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary md:text-base">
            {game.description[locale]}
          </p>

          <div className="mt-6">
            <Button
              as={Link}
              href={`/games/${game.slug}`}
              className="w-full md:w-auto"
            >
              {tCommon("play_cta")}
            </Button>
          </div>
        </div>
      </div>
    </AnimatedReveal>
  );
}

/* ═══════════════════════════════════════════════════
   Hub page
   ═══════════════════════════════════════════════════ */

export function GamesHubPage() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("GamesHub");
  const tCommon = useTranslations("GamesCommon");
  const playableGames = getPlayableGames();
  const upcomingGames = GAMES.filter((g) => g.status === "comingSoon");

  const {
    session,
    isHydrating,
    isSaving,
    errorCode,
    registerPlayer,
    clearPlayer,
  } = usePlayerSession();

  return (
    <div className="relative">
      {/* ══════ HERO ══════ */}
      <GamesHeroSection
        title={t("title")}
        description={t("description")}
        chips={[
          t("chip_quick"),
          t("chip_fun"),
          t("chip_no_signup"),
        ]}
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

      {/* ══════ ALL GAMES ══════ */}
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 md:px-8 md:pb-14 md:pt-8">
        <AnimatedReveal direction="up" delay={0.04}>
          <p className="text-[10px] uppercase tracking-[0.34em] text-accent md:text-xs">
            {t("grid_subtitle")}
          </p>
          <h2 className="heading-serif mt-4 text-3xl text-text-primary md:text-5xl">
            {t("grid_title")}
          </h2>
        </AnimatedReveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {playableGames.map((game, i) => (
            <LiveGameCard
              key={game.slug}
              game={game}
              index={i}
              locale={locale}
            />
          ))}
          {upcomingGames.map((game, i) => (
            <ComingSoonCard
              key={game.slug}
              game={game}
              index={i + playableGames.length}
              locale={locale}
            />
          ))}
        </div>
      </div>

      {/* ══════ LIVE FEED PROMO ══════ */}
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-4 md:px-8 md:pb-20">
        <AnimatedReveal direction="up">
          <div className="group relative rounded-[2.5rem] border border-accent/14 bg-linear-to-br from-accent/9 via-bg-primary/80 to-bg-primary/50 p-8 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.4)] transition-shadow duration-700 hover:shadow-[0_40px_100px_-36px_rgba(0,0,0,0.5)] md:p-10 lg:p-12">
            {/* Top accent stripe */}
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />

            <div className="relative z-10 max-w-2xl">
              {/* Live pulse */}
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                <span className="text-[10px] uppercase tracking-[0.34em] text-accent md:text-xs">
                  {tCommon("live_nav")}
                </span>
              </div>

              <h2 className="heading-serif mt-7 text-4xl leading-[0.94] text-text-primary md:text-5xl lg:text-6xl">
                {t("live_title")}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-text-secondary md:text-lg">
                {t("live_description")}
              </p>

              <div className="mt-8">
                <Button as={Link} href="/live" size="lg">
                  {t("live_cta")}
                </Button>
              </div>
            </div>

            {/* Giant watermark */}
            <span
              className="pointer-events-none absolute bottom-2 right-4 hidden select-none font-cinzel text-[11rem] uppercase leading-none tracking-wider text-accent/3 sm:block md:right-10 md:text-[15rem]"
              aria-hidden="true"
            >
              Live
            </span>
          </div>
        </AnimatedReveal>
      </div>
    </div>
  );
}
