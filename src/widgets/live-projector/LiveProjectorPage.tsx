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
  const [time, setTime] = useState(() => formatCurrentTime(locale));

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(formatCurrentTime(locale));
    }, 1000);
    return () => window.clearInterval(id);
  }, [locale]);

  return (
    <span className="font-cinzel tabular-nums text-2xl text-text-primary/55 md:text-3xl">
      {time}
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
        className="relative overflow-hidden rounded-3xl border border-accent/28 bg-linear-to-br from-accent/14 to-transparent px-5 py-4 shadow-[0_0_40px_-12px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
      >
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

// ─── LiveProjectorPage ────────────────────────────────────────────────────────

export function LiveProjectorPage() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("LivePage");
  const { snapshot, isLoading, error, heroEvent } = useLiveProjectorSnapshot(locale);

  return (
    <section className="relative min-h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_-5%_-5%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent),radial-gradient(ellipse_65%_50%_at_108%_108%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex items-center gap-5 rounded-4xl border border-accent/10 bg-bg-primary/55 px-6 py-4 shadow-[0_20px_56px_-36px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          {/* Pulsing live indicator */}
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-55" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <span className="font-cinzel text-xs uppercase tracking-[0.32em] text-accent">
              Live
            </span>
          </div>

          <div className="h-5 w-px shrink-0 bg-accent/15" />

          {/* Title */}
          <div className="min-w-0 flex-1">
            <h1 className="heading-serif text-2xl leading-none text-text-primary md:text-3xl">
              {t("title")}
            </h1>
          </div>

          {/* Live clock */}
          <LiveClock locale={locale} />
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
          <motion.div
            key={heroEvent.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(7,9,14,0.96)] backdrop-blur-2xl"
          >
            {/* Central radial glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_50%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_65%)]" />

            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
              className="relative mx-auto max-w-4xl px-6 text-center"
            >
              <p className="font-cinzel text-[10px] uppercase tracking-[0.48em] text-accent">
                {t(getHeroLabelKey(heroEvent.eventType))}
              </p>

              <div className="mt-8 flex justify-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/12 font-cinzel text-3xl tracking-[0.16em] text-accent shadow-[0_0_60px_-8px_color-mix(in_srgb,var(--accent)_45%,transparent)]">
                  {getAvatarMonogram(heroEvent.avatarKey, heroEvent.playerName)}
                </div>
              </div>

              <h2 className="heading-serif mt-8 text-6xl leading-[0.9] text-text-primary md:text-8xl">
                {heroEvent.playerName ?? t("anonymous_player")}
              </h2>

              {heroEvent.eventType === "wheel.round.promised" ||
              heroEvent.eventType === "wheel.round.completed" ? (
                <div className="mt-8 space-y-5">
                  {getEventPrompt(heroEvent, locale) ? (
                    <p className="text-xl leading-relaxed text-text-primary/90 md:text-2xl">
                      {getEventPrompt(heroEvent, locale)}
                    </p>
                  ) : null}
                  {heroEvent.answerText ? (
                    <p className="heading-serif-italic mt-1 text-2xl leading-snug text-text-primary/82 md:text-3xl">
                      — {heroEvent.answerText}
                    </p>
                  ) : null}
                  {heroEvent.xpDelta ? (
                    <div className="mt-6 flex items-baseline justify-center gap-3">
                      <span className="font-cinzel text-8xl leading-none text-accent">
                        +{heroEvent.xpDelta}
                      </span>
                      <span className="font-cinzel text-xl uppercase tracking-[0.22em] text-text-secondary/55">
                        XP
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {heroEvent.eventType === "leaderboard.new_top_player" ? (
                <p className="mt-6 text-xl leading-relaxed text-text-secondary md:text-2xl">
                  {t("new_top_player_note")}
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
