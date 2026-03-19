"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LiveFeedEventSnapshot } from "@/features/game-session";
import type { SupportedLocale } from "@/shared/config";
import { cn } from "@/shared/lib";
import {
  formatEventTime,
  getAvatarMonogram,
  getEventBarClass,
  getEventLabelKey,
  getEventPrompt,
  getGameTitle,
} from "./live-projector-helpers";

export function FeedEventCard({
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
