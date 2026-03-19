"use client";

import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { SupportedLocale } from "@/shared/config";
import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Link } from "@/shared/i18n/navigation";
import { cn } from "@/shared/lib";
import { FeedEventCard } from "./FeedEventCard";
import { HeroEventOverlay } from "./HeroEventOverlay";
import { LeaderboardRow } from "./LeaderboardRow";
import { LiveClock } from "./LiveClock";
import { useLiveProjectorSnapshot } from "./useLiveProjectorSnapshot";

export function LiveProjectorPage() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("LivePage");
  const tGames = useTranslations("GamesCommon");
  const { snapshot, isLoading, error, heroEvent } = useLiveProjectorSnapshot();

  return (
    <section className="relative min-h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_-5%_-5%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent),radial-gradient(ellipse_65%_50%_at_108%_108%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-400 flex-col gap-4 px-4 py-4 md:px-6 md:py-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="relative flex items-center rounded-4xl border border-accent/10 bg-bg-primary/55 px-6 py-4 shadow-[0_20px_56px_-36px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          {/* Left: live indicator + separator + title (title hidden on mobile) */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-55" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              <span className="font-cinzel text-xs uppercase tracking-[0.32em] text-accent">
                Live
              </span>
            </div>
            <div className="hidden h-5 w-px bg-accent/15 lg:block" />
            <h1 className="heading-serif hidden leading-none text-text-primary lg:block lg:text-3xl">
              {t("title")}
            </h1>
          </div>

          {/* Center: clock — strictly centered, hidden on mobile */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <LiveClock locale={locale} />
          </div>

          {/* Right desktop: games link + separator + theme + language */}
          <div className="ml-auto hidden shrink-0 items-center gap-8 lg:flex">
            <Link
              href="/games"
              className="group flex items-center gap-2 rounded-sm px-1 py-2 text-xs font-medium uppercase tracking-widest text-text-secondary/70 transition-colors hover:text-accent"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {tGames("back_to_games")}
            </Link>
            <div aria-hidden="true" className="mx-2 h-4 w-px bg-accent/30" />
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>

          {/* Right mobile: theme + language + separator + back arrow button */}
          <div className="ml-auto flex shrink-0 items-center gap-3 lg:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <div aria-hidden="true" className="mx-1 h-4 w-px bg-accent/30" />
            <Link
              href="/games"
              aria-label={tGames("back_to_games")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary/70 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </header>

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.88fr)]">

          {/* ─ Feed panel ─ */}
          <div className="flex flex-col rounded-4xl border border-accent/10 bg-bg-primary/45 p-5 shadow-[0_28px_72px_-48px_rgba(0,0,0,0.65)] backdrop-blur-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <p className="shrink-0 text-[10px] uppercase tracking-[0.34em] text-accent">
                {t("feed_label")}
              </p>
              <span className="h-px flex-1 bg-linear-to-r from-accent/22 to-transparent" />
            </div>

            {isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse rounded-3xl border border-accent/8 bg-bg-secondary/18"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex h-full min-h-64 items-center justify-center rounded-3xl border border-accent/10 bg-bg-secondary/22 px-6 text-center text-base text-text-secondary">
                {t("feed_error")}
              </div>
            ) : snapshot?.feed.length ? (
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {snapshot.feed.map((event) => (
                    <FeedEventCard key={event.id} event={event} locale={locale} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center rounded-3xl border border-accent/10 bg-bg-secondary/22 px-6 text-center text-base text-text-secondary">
                {t("feed_empty")}
              </div>
            )}
          </div>

          {/* ─ Leaderboard panel ─ */}
          <div className="flex flex-col rounded-4xl border border-accent/10 bg-bg-primary/45 p-5 shadow-[0_28px_72px_-48px_rgba(0,0,0,0.65)] backdrop-blur-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <p className="shrink-0 text-[10px] uppercase tracking-[0.34em] text-accent">
                {t("leaderboard_label")}
              </p>
              <span className="h-px flex-1 bg-linear-to-r from-accent/22 to-transparent" />
            </div>

            {isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "animate-pulse rounded-2xl border border-accent/8 bg-bg-secondary/18",
                      i === 0 ? "h-20" : "h-14"
                    )}
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex min-h-64 items-center justify-center rounded-3xl border border-accent/10 bg-bg-secondary/22 px-6 text-center text-base text-text-secondary">
                {t("leaderboard_error")}
              </div>
            ) : snapshot?.leaderboard.length ? (
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {snapshot.leaderboard.map((entry) => (
                    <LeaderboardRow
                      key={entry.playerId}
                      entry={entry}
                      isLeader={entry.rank === 1}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-3xl border border-accent/10 bg-bg-secondary/22 px-6 text-center text-base text-text-secondary">
                {t("leaderboard_empty")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero event overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {heroEvent ? (
          <HeroEventOverlay
            key={heroEvent.id}
            heroEvent={heroEvent}
            locale={locale}
            totalPoints={
              heroEvent.playerId
                ? snapshot?.leaderboard.find((e) => e.playerId === heroEvent.playerId)?.totalPoints
                : undefined
            }
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
