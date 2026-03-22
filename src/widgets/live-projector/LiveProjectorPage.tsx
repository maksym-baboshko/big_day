"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MOTION_EASE } from "@/shared/lib";
import { useLocale, useTranslations } from "next-intl";
import type { SupportedLocale } from "@/shared/config";
import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Link } from "@/shared/i18n/navigation";
import { FeedEmptyState } from "./FeedEmptyState";
import { FeedEventCard } from "./FeedEventCard";
import { HeroEventOverlay } from "./HeroEventOverlay";
import { LeaderboardEmptyState } from "./LeaderboardEmptyState";
import { LeaderboardRow } from "./LeaderboardRow";
import { LiveClock } from "./LiveClock";
import {
  DESKTOP_FEED_INITIAL_VISIBLE,
  DESKTOP_FEED_LOAD_MORE_STEP,
  MOBILE_FEED_INITIAL_VISIBLE,
  MOBILE_FEED_LOAD_MORE_STEP,
} from "./live-projector-helpers";
import { useLiveProjectorSnapshot } from "./useLiveProjectorSnapshot";

const MOBILE_FEED_MEDIA_QUERY = "(max-width: 1023px)";

function getMobileFeedSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_FEED_MEDIA_QUERY).matches;
}

function getMobileFeedServerSnapshot() {
  return false;
}

function subscribeToMobileFeed(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(MOBILE_FEED_MEDIA_QUERY);
  const handler = () => callback();

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }

  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
}

export function LiveProjectorPage() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("LivePage");
  const tGames = useTranslations("GamesCommon");
  const { snapshot, isLoading, error, heroEvent } = useLiveProjectorSnapshot();
  const isMobileFeed = useSyncExternalStore(
    subscribeToMobileFeed,
    getMobileFeedSnapshot,
    getMobileFeedServerSnapshot
  );

  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_FEED_INITIAL_VISIBLE);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState(
    DESKTOP_FEED_INITIAL_VISIBLE
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  const visibleCount = isMobileFeed ? mobileVisibleCount : desktopVisibleCount;
  const hasMoreFeed = (snapshot?.feed.length ?? 0) > visibleCount;
  const visibleFeed = snapshot?.feed.slice(0, visibleCount) ?? [];
  const showFeedEmptyState = !error && (isLoading || !snapshot?.feed.length);
  const showLeaderboardEmptyState =
    !error && (isLoading || !snapshot?.leaderboard.length);
  const desktopFeedColumns = [
    visibleFeed.filter((_, index) => index % 2 === 0),
    visibleFeed.filter((_, index) => index % 2 !== 0),
  ];

  const handleLoadMore = useCallback(() => {
    setMobileVisibleCount((prev) => prev + MOBILE_FEED_LOAD_MORE_STEP);
  }, []);

  // Callback ref: called by React exactly when the sentinel mounts or unmounts —
  // no race condition between ref assignment and effect scheduling.
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDesktopVisibleCount((prev) => prev + DESKTOP_FEED_LOAD_MORE_STEP);
        }
      },
      { rootMargin: "200px" }
    );
    observerRef.current.observe(node);
  }, []);

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-bg-primary text-text-primary"
      data-testid="live-projector-page"
    >
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_-5%_-5%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent),radial-gradient(ellipse_65%_50%_at_108%_108%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent)]" />

      <div className="relative z-10 flex min-h-screen flex-col gap-4 px-4 py-4 md:px-6 md:py-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="relative flex items-center rounded-4xl border border-accent/20 bg-bg-secondary/30 px-6 py-4 shadow-[0_20px_56px_-36px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          {/* Left: live indicator */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-55" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              <span className="text-[14px] font-medium uppercase tracking-[0.32em] text-accent">
                Live
              </span>
            </div>
          </div>

          {/* Center: clock — strictly centered, hidden on mobile */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <LiveClock locale={locale} />
          </div>

          {/* Right desktop: games link + separator + theme + language */}
          <div className="ml-auto hidden shrink-0 items-center gap-8 lg:flex">
            <Link
              href="/games"
              className="group flex items-center gap-2 rounded-sm px-1 py-2 text-xs font-medium uppercase tracking-widest text-accent/70 transition-colors hover:text-accent"
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
              <ThemeSwitcher className="bg-transparent" />
              <LanguageSwitcher className="bg-transparent" />
            </div>
          </div>

          {/* Right mobile: theme + language + separator + back arrow button */}
          <div className="ml-auto flex shrink-0 items-center gap-3 lg:hidden">
            <ThemeSwitcher className="bg-transparent" />
            <LanguageSwitcher className="bg-transparent" />
            <div aria-hidden="true" className="mx-1 h-4 w-px bg-accent/30" />
            <Link
              href="/games"
              aria-label={tGames("back_to_games")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-accent transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
        <div className="grid gap-4 lg:flex-1 lg:grid-cols-[minmax(0,4fr)_minmax(420px,1fr)] lg:grid-rows-1">

          {/* ─ Feed panel ─ */}
          <div className="flex flex-col gap-3 lg:pr-4">
            {showFeedEmptyState ? (
              <FeedEmptyState variant={isLoading ? "loading" : "empty"} />
            ) : error ? (
              <div className="flex min-h-64 items-center justify-center rounded-3xl border border-accent/10 bg-bg-secondary/22 px-6 text-center text-base text-text-secondary">
                {t("feed_error")}
              </div>
            ) : snapshot?.feed.length ? (
              <>
                <div className="flex flex-col gap-3 sm:hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visibleFeed.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.4, ease: MOTION_EASE }}
                      >
                        <FeedEventCard event={event} locale={locale} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="hidden gap-3 sm:flex">
                  {desktopFeedColumns.map((colEvents, colIdx) => (
                    <div key={colIdx} className="flex flex-1 flex-col gap-3">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {colEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.4, ease: MOTION_EASE }}
                          >
                            <FeedEventCard event={event} locale={locale} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Desktop infinite scroll sentinel — hidden on mobile, observer won't fire */}
                {hasMoreFeed && (
                  <div ref={sentinelRef} className="hidden h-1 lg:block" aria-hidden="true" />
                )}

                {/* Mobile load-more button */}
                {hasMoreFeed && (
                  <button
                    onClick={handleLoadMore}
                    className="mt-1 w-full rounded-3xl border border-accent/15 bg-bg-primary/55 py-4 text-[11px] uppercase tracking-[0.28em] text-text-secondary/60 backdrop-blur-sm transition-colors hover:border-accent/30 hover:text-accent lg:hidden"
                  >
                    {t("feed_load_more")}
                  </button>
                )}
              </>
            ) : null}
          </div>

          {/* ─ Leaderboard panel ─ */}
          <div className="flex flex-col gap-3">

            {showLeaderboardEmptyState ? (
              <LeaderboardEmptyState />
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
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Bottom gradient — full-width fade masking overflowing cards ── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-bg-primary to-transparent" />

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
