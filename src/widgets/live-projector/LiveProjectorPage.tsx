"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type {
  LeaderboardEntrySnapshot,
  LiveFeedEventSnapshot,
} from "@/features/game-session";
import { getGameBySlug } from "@/shared/config";
import type { SupportedLocale } from "@/shared/config";
import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Link } from "@/shared/i18n/navigation";
import { cn } from "@/shared/lib";
import { useLiveProjectorSnapshot } from "./useLiveProjectorSnapshot";

// ─── helpers ────────────────────────────────────────────────────────────────

function getAvatarMonogram(avatarKey: string | null, fallbackName?: string | null) {
  const normalizedKey = avatarKey?.trim();
  if (normalizedKey) {
    return normalizedKey
      .split("-")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }
  return fallbackName?.trim().charAt(0).toUpperCase() ?? "•";
}

function formatEventTime(value: string, locale: SupportedLocale) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrentTime(locale: SupportedLocale) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function getEventPrompt(event: LiveFeedEventSnapshot, fallbackLocale: SupportedLocale) {
  const eventLocale = event.locale ?? fallbackLocale;
  return eventLocale === "uk" ? event.promptI18n.uk : event.promptI18n.en;
}

function getGameTitle(gameSlug: LiveFeedEventSnapshot["gameSlug"], locale: SupportedLocale) {
  const game = getGameBySlug(gameSlug);
  if (!game) return null;
  return locale === "uk" ? game.title.uk : game.title.en;
}

function getHeroLabelKey(eventType: string | null | undefined) {
  switch (eventType) {
    case "wheel.round.completed": return "event_answered";
    case "wheel.round.promised": return "hero_promised";
    case "leaderboard.new_top_player": return "hero_new_top_player";
    case "player.joined": return "event_player_joined";
    case "xp.awarded": return "event_xp_awarded";
    default: return "hero_generic";
  }
}

function getEventLabelKey(eventType: string | null | undefined) {
  switch (eventType) {
    case "player.joined": return "event_player_joined";
    case "xp.awarded": return "event_xp_awarded";
    case "wheel.round.completed": return "event_answered";
    case "wheel.round.promised": return "event_promised";
    case "leaderboard.new_top_player": return "event_new_top_player";
    default: return "event_generic";
  }
}

function getEventBarClass(eventType: string | null | undefined) {
  switch (eventType) {
    case "leaderboard.new_top_player":
    case "wheel.round.completed":
      return "bg-accent";
    case "xp.awarded":
      return "bg-accent/75";
    case "wheel.round.promised":
      return "bg-accent/45";
    case "player.joined":
      return "bg-text-secondary/35";
    default:
      return "bg-accent/30";
  }
}

// ─── LiveClock ───────────────────────────────────────────────────────────────

function LiveClock({ locale }: { locale: SupportedLocale }) {
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    const initialTickId = window.setTimeout(() => {
      setTime(formatCurrentTime(locale));
    }, 0);

    const id = window.setInterval(() => {
      setTime(formatCurrentTime(locale));
    }, 1000);

    return () => {
      window.clearTimeout(initialTickId);
      window.clearInterval(id);
    };
  }, [locale]);

  return (
    <span className="font-cinzel tabular-nums text-2xl text-text-primary/55 md:text-3xl">
      <time suppressHydrationWarning>{time}</time>
    </span>
  );
}

// ─── FeedEventCard ────────────────────────────────────────────────────────────

function FeedEventCard({
  event,
  locale,
}: {
  event: LiveFeedEventSnapshot;
  locale: SupportedLocale;
}) {
  const t = useTranslations("LivePage");
  const prompt = getEventPrompt(event, locale);
  const timestamp = formatEventTime(event.createdAt, locale);
  const gameTitle = getGameTitle(event.gameSlug, locale);
  const eventLabelKey = getEventLabelKey(event.eventType);
  const barClass = getEventBarClass(event.eventType);
  const hasXp = event.xpDelta != null && event.xpDelta !== 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-accent/10 bg-bg-primary/68 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.5)] backdrop-blur-sm"
    >
      {/* Left accent stripe */}
      <div className={cn("absolute inset-y-0 left-0 w-[3px] rounded-l-3xl", barClass)} />

      <div className="px-6 py-5 pl-8">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/22 bg-accent/10 font-cinzel text-sm tracking-[0.15em] text-accent">
              {getAvatarMonogram(event.avatarKey, event.playerName)}
            </div>
            <div>
              <p className="text-lg leading-tight text-text-primary">
                {event.playerName ?? t("anonymous_player")}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.26em] text-accent/80">
                {t(eventLabelKey)}
                {gameTitle ? (
                  <>
                    <span className="mx-1.5 text-text-secondary/30">·</span>
                    <span className="text-text-secondary/50">{gameTitle}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <p className="shrink-0 font-cinzel text-sm text-text-secondary/38">
            {timestamp}
          </p>
        </div>

        {/* Body */}
        {event.eventType === "player.joined" ? (
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            {event.welcomeText ?? t("welcome_default")}
          </p>
        ) : null}

        {event.eventType === "leaderboard.new_top_player" ? (
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            {t("new_top_player_note")}
          </p>
        ) : null}

        {prompt ? (
          <p className="heading-serif mt-4 text-2xl leading-snug text-text-primary">
            {prompt}
          </p>
        ) : null}

        {event.answerText ? (
          <p className="heading-serif-italic mt-2 text-xl leading-snug text-text-primary/82">
            — {event.answerText}
          </p>
        ) : null}

        {hasXp ? (
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-cinzel text-5xl leading-none text-accent">
              +{event.xpDelta}
            </span>
            <span className="text-xs uppercase tracking-[0.24em] text-text-secondary/50">
              XP
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── LeaderboardRow ───────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  isLeader,
}: {
  entry: LeaderboardEntrySnapshot;
  isLeader: boolean;
}) {
  if (isLeader) {
    return (
      <motion.div
        layout
        className="relative overflow-hidden rounded-3xl border border-accent/18 bg-accent/7 px-5 py-4"
      >
        {/* Thin top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/65 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="font-cinzel text-4xl leading-none text-accent">1</div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent/32 bg-accent/12 font-cinzel text-sm tracking-[0.14em] text-accent">
            {getAvatarMonogram(entry.avatarKey, entry.nickname)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="heading-serif truncate text-xl leading-tight text-text-primary">
              {entry.nickname}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-cinzel text-3xl leading-none text-accent">
              {entry.totalPoints}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-text-secondary/50">
              XP
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3",
        entry.rank === 2 || entry.rank === 3
          ? "border-accent/14 bg-accent/5"
          : "border-accent/8 bg-bg-primary/50"
      )}
    >
      <div className="w-6 shrink-0 text-center font-cinzel text-base text-accent/60">
        {entry.rank}
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/16 bg-accent/8 font-cinzel text-xs tracking-[0.14em] text-accent">
        {getAvatarMonogram(entry.avatarKey, entry.nickname)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] text-text-primary">{entry.nickname}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="font-cinzel text-xl text-text-primary">{entry.totalPoints}</span>
        <span className="ml-1.5 text-[9px] uppercase tracking-[0.2em] text-text-secondary/45">
          XP
        </span>
      </div>
    </motion.div>
  );
}

// ─── Hero overlay pieces ─────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

function SonarRing({ delay, finalScale }: { delay: number; finalScale: number }) {
  return (
    <motion.span
      className="absolute inset-0 rounded-full border border-accent/30"
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: finalScale, opacity: [0, 0.5, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

function XpCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let raf: number;
    const startTimer = window.setTimeout(() => {
      const duration = 1200;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [value, delay]);

  return <>{count}</>;
}

// ─── HeroEventOverlay ────────────────────────────────────────────────────────

function HeroEventOverlay({
  heroEvent,
  locale,
  totalPoints,
}: {
  heroEvent: LiveFeedEventSnapshot;
  locale: SupportedLocale;
  totalPoints?: number;
}) {
  const t = useTranslations("LivePage");
  const isTopPlayer = heroEvent.eventType === "leaderboard.new_top_player";
  const isWheelEvent =
    heroEvent.eventType === "wheel.round.completed" ||
    heroEvent.eventType === "wheel.round.promised";
  const prompt = getEventPrompt(heroEvent, locale);

  // Prevent body scroll while overlay is visible
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed inset-0 z-20 flex flex-col overflow-hidden"
      style={{ backgroundColor: "rgba(5, 7, 12, 0.91)" }}
    >
      {/* Breathing ambient glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 50%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 68%)",
        }}
      />

      {/* Slow-drifting secondary gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 9, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 42% 32% at 22% 78%, color-mix(in srgb, var(--accent) 5%, transparent), transparent)",
        }}
      />

      {/* ── Top zone: avatar (50vh) ───────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 22, mass: 0.9, delay: 0.1 }}
          className="relative flex items-center justify-center"
        >
          <div
            className="relative"
            style={{ width: "min(11rem, 22vh)", height: "min(11rem, 22vh)" }}
          >
            <SonarRing delay={0} finalScale={2.2} />
            <SonarRing delay={0.95} finalScale={2.85} />
            <SonarRing delay={1.9} finalScale={3.5} />

            <div
              className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 font-cinzel tracking-[0.18em] text-accent shadow-[0_0_100px_-4px_color-mix(in_srgb,var(--accent)_55%,transparent),inset_0_0_60px_-16px_color-mix(in_srgb,var(--accent)_24%,transparent)]"
              style={{ fontSize: "min(1.875rem, 4vh)" }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border border-accent/22"
                animate={{ opacity: [0.25, 0.85, 0.25] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10">
                {getAvatarMonogram(heroEvent.avatarKey, heroEvent.playerName)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom zone: name + content (50vh) ───────────────────────── */}
      <div
        className="relative flex flex-1 flex-col items-center justify-start px-12"
        style={{ paddingTop: "3vh", paddingBottom: "5vh", gap: "4vh" }}
      >
        {/* Name */}
        <motion.h2
          initial={{ opacity: 0, scale: 1.14, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
          className="heading-serif text-center leading-[0.88] text-text-primary"
          style={{ fontSize: "clamp(3rem, min(14vw, 13vh), 9.5rem)" }}
        >
          {heroEvent.playerName ?? t("anonymous_player")}
        </motion.h2>

        {/* Top-player: subtitle + total XP */}
        {isTopPlayer ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.52, ease: EASE }}
            className="flex flex-col items-center text-center"
            style={{ gap: "3vh" }}
          >
            <p className="max-w-xl text-xl leading-relaxed text-text-secondary/65 md:text-2xl">
              {t("new_top_player_note")}
            </p>

            {totalPoints != null ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.72, ease: EASE }}
                className="flex items-baseline gap-5"
              >
                <span
                  className="font-cinzel leading-none text-accent"
                  style={{ fontSize: "clamp(2.5rem, min(11vw, 9vh), 7.5rem)" }}
                >
                  <XpCounter value={totalPoints} delay={720} />
                </span>
                <span className="font-cinzel text-3xl uppercase tracking-[0.3em] text-text-secondary/45">
                  XP
                </span>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}

        {/* Wheel event: question + answer + XP badge */}
        {isWheelEvent ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.52, ease: EASE }}
            className="flex flex-col items-center text-center"
            style={{ gap: "2vh" }}
          >
            {prompt ? (
              <p className="max-w-2xl text-lg leading-relaxed text-text-primary/72 md:text-xl">
                {prompt}
              </p>
            ) : null}
            {heroEvent.answerText ? (
              <p className="heading-serif-italic max-w-xl text-xl leading-snug text-text-primary/55 md:text-2xl">
                — {heroEvent.answerText}
              </p>
            ) : null}
            {heroEvent.xpDelta ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.82, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.74, ease: EASE }}
                className="flex items-center gap-3 rounded-full border border-accent/28 bg-accent/8 px-8 py-3"
              >
                <span className="font-cinzel text-xl text-accent">
                  +<XpCounter value={heroEvent.xpDelta} delay={740} />
                </span>
                <span className="font-cinzel text-[10px] uppercase tracking-[0.3em] text-text-secondary/45">
                  XP
                </span>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}

        {/* Label — pinned to the bottom of the overlay */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.65, ease: EASE }}
          className="absolute font-cinzel text-xs uppercase tracking-[0.45em] text-accent/60"
          style={{ bottom: "3vh" }}
        >
          {t(getHeroLabelKey(heroEvent.eventType))}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── LiveProjectorPage ────────────────────────────────────────────────────────

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
