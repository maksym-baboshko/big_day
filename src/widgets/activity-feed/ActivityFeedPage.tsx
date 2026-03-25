"use client";

import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Link } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
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
} from "./activity-feed-helpers";
import type { LeaderboardEntrySnapshot, LiveFeedEventSnapshot, LiveSnapshot } from "./types";

// ─── Stub data ────────────────────────────────────────────────────────────────

const STUB_FEED: LiveFeedEventSnapshot[] = [
  {
    id: "1",
    type: "player_joined",
    playerId: "p1",
    avatarKey: "olena-kovalchuk",
    playerName: "Олена Ковальчук",
    gameSlug: null,
    promptI18n: null,
    answerI18n: null,
    xpDelta: 50,
    createdAt: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: "2",
    type: "promised",
    playerId: "p2",
    avatarKey: "andriy-bondar",
    playerName: "Андрій Бондар",
    gameSlug: "wheel",
    promptI18n: { uk: "Що ти обіцяєш молодятам?", en: "What do you promise the newlyweds?" },
    answerI18n: {
      uk: "Завжди бути поруч і підтримувати вас у будь-яку мить!",
      en: "Always be there and support you at any moment!",
    },
    xpDelta: 120,
    createdAt: new Date(Date.now() - 240_000).toISOString(),
  },
  {
    id: "3",
    type: "xp_awarded",
    playerId: "p3",
    avatarKey: "maria-petrenko",
    playerName: "Марія Петренко",
    gameSlug: null,
    promptI18n: null,
    answerI18n: null,
    xpDelta: 80,
    createdAt: new Date(Date.now() - 360_000).toISOString(),
  },
  {
    id: "4",
    type: "answered",
    playerId: "p1",
    avatarKey: "olena-kovalchuk",
    playerName: "Олена Ковальчук",
    gameSlug: "trivia",
    promptI18n: { uk: "Де познайомилися Максим і Діана?", en: "Where did Maksym and Diana meet?" },
    answerI18n: { uk: "У Бергені", en: "In Bergen" },
    xpDelta: 100,
    createdAt: new Date(Date.now() - 480_000).toISOString(),
  },
  {
    id: "5",
    type: "new_top_player",
    playerId: "p2",
    avatarKey: "andriy-bondar",
    playerName: "Андрій Бондар",
    gameSlug: null,
    promptI18n: null,
    answerI18n: null,
    xpDelta: null,
    createdAt: new Date(Date.now() - 600_000).toISOString(),
  },
  {
    id: "6",
    type: "player_joined",
    playerId: "p4",
    avatarKey: "ivan-sydorenko",
    playerName: "Іван Сидоренко",
    gameSlug: null,
    promptI18n: null,
    answerI18n: null,
    xpDelta: 50,
    createdAt: new Date(Date.now() - 720_000).toISOString(),
  },
  {
    id: "7",
    type: "promised",
    playerId: "p3",
    avatarKey: "maria-petrenko",
    playerName: "Марія Петренко",
    gameSlug: "wheel",
    promptI18n: { uk: "Твоє побажання парі?", en: "Your wish for the couple?" },
    answerI18n: {
      uk: "Міцного здоров'я та невичерпного щастя!",
      en: "Good health and endless happiness!",
    },
    xpDelta: 110,
    createdAt: new Date(Date.now() - 840_000).toISOString(),
  },
];

const STUB_LEADERBOARD: LeaderboardEntrySnapshot[] = [
  { rank: 1, playerId: "p2", avatarKey: "andriy-bondar", nickname: "Андрій Б.", totalPoints: 350 },
  { rank: 2, playerId: "p1", avatarKey: "olena-kovalchuk", nickname: "Олена К.", totalPoints: 280 },
  { rank: 3, playerId: "p3", avatarKey: "maria-petrenko", nickname: "Марія П.", totalPoints: 190 },
  { rank: 4, playerId: "p4", avatarKey: "ivan-sydorenko", nickname: "Іван С.", totalPoints: 120 },
  { rank: 5, playerId: "p5", avatarKey: "sofiya-moroz", nickname: "Софія М.", totalPoints: 80 },
];

const STUB_SNAPSHOT: LiveSnapshot = {
  feed: STUB_FEED,
  leaderboard: STUB_LEADERBOARD,
  generatedAt: new Date().toISOString(),
};

// ─── Mobile media query ───────────────────────────────────────────────────────

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

function getMobileSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

function subscribeToMobile(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
  const handler = () => callback();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ActivityFeedPageProps {
  locale: Locale;
}

export function ActivityFeedPage({ locale }: ActivityFeedPageProps) {
  const t = useTranslations("LivePage");

  // In PR 8 we render stub data. PR 9+ will wire this to /api/live.
  const snapshot = STUB_SNAPSHOT;
  const isLoading = false;
  const error = false;
  const heroEvent = null;

  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );

  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_FEED_INITIAL_VISIBLE);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState(DESKTOP_FEED_INITIAL_VISIBLE);

  const visibleCount = isMobile ? mobileVisibleCount : desktopVisibleCount;
  const hasMoreFeed = snapshot.feed.length > visibleCount;
  const visibleFeed = snapshot.feed.slice(0, visibleCount);

  const showFeedEmptyState = isLoading || snapshot.feed.length === 0;
  const showLeaderboardEmptyState = isLoading || snapshot.leaderboard.length === 0;

  const desktopFeedColumns = [
    visibleFeed.filter((_, i) => i % 2 === 0),
    visibleFeed.filter((_, i) => i % 2 !== 0),
  ];

  const handleLoadMore = useCallback(() => {
    setMobileVisibleCount((prev) => prev + MOBILE_FEED_LOAD_MORE_STEP);
  }, []);

  const observerRef = useRef<IntersectionObserver | null>(null);
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
      { rootMargin: "200px" },
    );
    observerRef.current.observe(node);
  }, []);

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-bg-primary text-text-primary"
      data-testid="live-projector-page"
    >
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_-5%_-5%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent),radial-gradient(ellipse_65%_50%_at_108%_108%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent)]" />

      <div className="relative z-10 flex min-h-screen flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        {/* ── Header ── */}
        <header className="relative flex items-center rounded-4xl border border-accent/20 bg-bg-secondary/30 px-6 py-4 shadow-[0_20px_56px_-36px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          {/* Left: live indicator */}
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-55" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <span className="text-[14px] font-medium uppercase tracking-[0.32em] text-accent">
              Live
            </span>
          </div>

          {/* Center: clock (desktop only) */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <LiveClock />
          </div>

          {/* Right: theme + language + home link */}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <div aria-hidden="true" className="mx-1 h-4 w-px bg-accent/30" />
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 text-accent/70 transition-colors hover:border-accent/50 hover:text-accent"
              aria-label="На головну"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </Link>
          </div>
        </header>

        {/* ── Main grid ── */}
        <div className="grid gap-4 lg:flex-1 lg:grid-cols-[minmax(0,4fr)_minmax(420px,1fr)]">
          {/* Feed panel */}
          <div className="flex flex-col gap-3">
            {showFeedEmptyState ? (
              <FeedEmptyState variant={isLoading ? "loading" : "empty"} />
            ) : error ? (
              <p className="rounded-3xl border border-error/20 bg-error/5 px-5 py-4 text-sm text-error">
                {t("feed_error")}
              </p>
            ) : (
              <>
                {/* Mobile: single column */}
                <div className="flex flex-col gap-3 lg:hidden">
                  {visibleFeed.map((event) => (
                    <FeedEventCard key={event.id} event={event} />
                  ))}
                  {hasMoreFeed && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="font-cinzel rounded-full border border-accent/25 bg-transparent px-6 py-3 text-xs tracking-widest text-accent transition-colors hover:bg-accent/10"
                    >
                      {t("feed_load_more")}
                    </button>
                  )}
                </div>

                {/* Desktop: 2 columns */}
                <div className="hidden gap-3 lg:grid lg:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    {(desktopFeedColumns[0] ?? []).map((event) => (
                      <FeedEventCard key={event.id} event={event} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    {(desktopFeedColumns[1] ?? []).map((event) => (
                      <FeedEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>

                {/* Desktop infinite scroll sentinel */}
                {hasMoreFeed && <div ref={sentinelRef} className="hidden h-1 lg:block" />}
              </>
            )}
          </div>

          {/* Leaderboard panel */}
          <div className="flex flex-col gap-3">
            {showLeaderboardEmptyState ? (
              <LeaderboardEmptyState />
            ) : error ? (
              <p className="rounded-3xl border border-error/20 bg-error/5 px-5 py-4 text-sm text-error">
                {t("leaderboard_error")}
              </p>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-bg-primary to-transparent" />

      {/* Hero event overlay */}
      <AnimatePresence>
        {heroEvent && (
          <HeroEventOverlay
            key={(heroEvent as LiveFeedEventSnapshot).id}
            heroEvent={heroEvent as LiveFeedEventSnapshot}
            locale={locale}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
