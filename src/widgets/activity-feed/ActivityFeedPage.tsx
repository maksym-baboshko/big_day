"use client";

import type { LiveFeedState } from "@/entities/event";
import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Link } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";
import { MOTION_EASE } from "@/shared/lib";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { FeedClock } from "./FeedClock";
import { FeedEmptyState } from "./FeedEmptyState";
import { FeedEventCard } from "./FeedEventCard";
import { HeroEventOverlay } from "./HeroEventOverlay";
import { LeaderboardList } from "./LeaderboardList";
import { LeaderboardState } from "./LeaderboardState";
import {
  DESKTOP_FEED_INITIAL_VISIBLE,
  DESKTOP_FEED_LOAD_MORE_STEP,
  MOBILE_FEED_INITIAL_VISIBLE,
  MOBILE_FEED_LOAD_MORE_STEP,
  getVisibleFeed,
  hasMoreFeedForViewport,
  splitFeedIntoColumns,
} from "./activity-feed-helpers";
import { useActivityFeedSnapshot } from "./useActivityFeedSnapshot";

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

function getMobileSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

function subscribeToMobile(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
  const handler = () => callback();
  mediaQuery.addEventListener("change", handler);

  return () => mediaQuery.removeEventListener("change", handler);
}

interface ActivityFeedPageProps {
  locale: Locale;
  initialState?: Exclude<LiveFeedState, "loading">;
}

export function ActivityFeedPage({ locale, initialState = "populated" }: ActivityFeedPageProps) {
  const t = useTranslations("ActivityFeedPage");
  const tNavbar = useTranslations("Navbar");
  const { snapshot, state, heroEvent } = useActivityFeedSnapshot({ initialState });
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_FEED_INITIAL_VISIBLE);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState(DESKTOP_FEED_INITIAL_VISIBLE);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const visibleCount = isMobile ? mobileVisibleCount : desktopVisibleCount;
  const totalFeedCount = snapshot?.feed.length ?? 0;
  const hasMoreFeed = hasMoreFeedForViewport(totalFeedCount, visibleCount);
  const visibleFeed = getVisibleFeed(snapshot?.feed ?? [], visibleCount);
  const isLoading = state === "loading";
  const isError = state === "error";
  const isEmpty = state === "empty";
  const desktopFeedColumns = splitFeedIntoColumns(visibleFeed);

  const handleLoadMore = useCallback(() => {
    setMobileVisibleCount((previousCount) => previousCount + MOBILE_FEED_LOAD_MORE_STEP);
  }, []);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDesktopVisibleCount((previousCount) => previousCount + DESKTOP_FEED_LOAD_MORE_STEP);
        }
      },
      { rootMargin: "200px" },
    );

    observerRef.current.observe(node);
  }, []);

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-bg-primary text-text-primary"
      data-testid="live-projector-page"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_-5%_-5%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent),radial-gradient(ellipse_65%_50%_at_108%_108%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent)]" />

      <div className="relative z-10 flex min-h-screen flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        <header className="relative flex items-center rounded-4xl border border-accent/20 bg-bg-secondary/30 px-6 py-4 shadow-[0_20px_56px_-36px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {isError ? null : (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-55" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full transition-colors ${isError ? "bg-text-secondary/30" : "bg-accent"}`}
                />
              </span>
              <span
                className={`text-[14px] font-medium uppercase tracking-[0.32em] transition-colors ${isError ? "text-text-secondary/40" : "text-accent"}`}
              >
                {t("live_label")}
              </span>
            </div>
          </div>

          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <FeedClock />
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-8 lg:flex">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-sm px-1 py-2 text-xs font-medium uppercase tracking-widest text-accent/70 transition-colors hover:text-accent"
              aria-label={tNavbar("hero")}
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
              {tNavbar("hero")}
            </Link>
            <div aria-hidden="true" className="mx-2 h-4 w-px bg-accent/30" />
            <div className="flex items-center gap-3">
              <ThemeSwitcher className="bg-transparent" />
              <LanguageSwitcher className="bg-transparent" />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3 lg:hidden">
            <ThemeSwitcher className="bg-transparent" />
            <LanguageSwitcher className="bg-transparent" />
            <div aria-hidden="true" className="mx-1 h-4 w-px bg-accent/30" />
            <Link
              href="/"
              aria-label={tNavbar("hero")}
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

        <div className="grid gap-4 lg:flex-1 lg:grid-cols-[minmax(0,4fr)_minmax(420px,1fr)] lg:grid-rows-1">
          <div className="flex flex-col gap-3 lg:pr-4">
            {isError ? (
              <FeedEmptyState variant="error" />
            ) : isLoading || isEmpty || !snapshot?.feed.length ? (
              <FeedEmptyState variant={isLoading ? "loading" : "empty"} />
            ) : (
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
                        <FeedEventCard event={event} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="hidden gap-3 sm:flex">
                  {[
                    { id: "left", events: desktopFeedColumns.left },
                    { id: "right", events: desktopFeedColumns.right },
                  ].map((column) => (
                    <div key={column.id} className="flex flex-1 flex-col gap-3">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {column.events.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.4, ease: MOTION_EASE }}
                          >
                            <FeedEventCard event={event} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {hasMoreFeed ? <div ref={sentinelRef} className="hidden h-1 lg:block" /> : null}

                {hasMoreFeed ? (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="mt-1 w-full rounded-3xl border border-accent/15 bg-bg-primary/55 py-4 text-[11px] uppercase tracking-[0.28em] text-text-secondary/60 backdrop-blur-sm transition-colors hover:border-accent/30 hover:text-accent lg:hidden"
                  >
                    {t("feed_load_more")}
                  </button>
                ) : null}
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isError ? (
              <LeaderboardState variant="error" />
            ) : isLoading || isEmpty || !snapshot?.leaderboard.length ? (
              <LeaderboardState />
            ) : (
              <LeaderboardList entries={snapshot.leaderboard} />
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-bg-primary to-transparent" />

      <AnimatePresence>
        {heroEvent ? (
          <HeroEventOverlay
            key={heroEvent.id}
            heroEvent={heroEvent}
            locale={locale}
            totalPoints={
              heroEvent.playerId
                ? snapshot?.leaderboard.find((entry) => entry.playerId === heroEvent.playerId)
                    ?.totalPoints
                : undefined
            }
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
