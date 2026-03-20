"use client";

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
  const playerName = event.playerName ?? t("anonymous_player");

  // Cards without a prompt are structurally simple — use compact layout
  if (!prompt) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-accent/10 bg-bg-primary/68 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className={cn("absolute inset-y-0 left-0 w-[3px] rounded-l-2xl", barClass)} />

        <div className="py-3 pl-6 pr-4">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/22 bg-accent/10 font-cinzel text-xs tracking-[0.14em] text-accent">
              {getAvatarMonogram(event.avatarKey, event.playerName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-base leading-tight text-text-primary">{playerName}</p>
                <p className="shrink-0 font-cinzel text-xs text-text-secondary/38">{timestamp}</p>
              </div>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-accent/80">
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

          {/* Body */}
          {event.eventType === "player.joined" ? (
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {event.welcomeText ?? t("welcome_default")}
            </p>
          ) : null}

          {event.eventType === "leaderboard.new_top_player" ? (
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t("new_top_player_note")}
            </p>
          ) : null}

          {hasXp ? (
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-cinzel text-2xl leading-none text-accent">+{event.xpDelta}</span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-text-secondary/50">XP</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Full layout for events with a prompt (answers, promises, etc.)
  return (
    <div className="relative overflow-hidden rounded-3xl border border-accent/10 bg-bg-primary/68 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.5)] backdrop-blur-sm">
      <div className={cn("absolute inset-y-0 left-0 w-[3px] rounded-l-3xl", barClass)} />

      <div className="py-4 pl-7 pr-5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/22 bg-accent/10 font-cinzel text-xs tracking-[0.14em] text-accent">
              {getAvatarMonogram(event.avatarKey, event.playerName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base leading-tight text-text-primary">{playerName}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-accent/80">
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
          <p className="shrink-0 font-cinzel text-xs text-text-secondary/38">{timestamp}</p>
        </div>

        {/* Prompt */}
        <p className="heading-serif mt-3 text-xl leading-snug text-text-primary">{prompt}</p>

        {/* Answer */}
        {event.answerText ? (
          <p className="heading-serif-italic mt-1.5 text-lg leading-snug text-text-primary/82">
            — {event.answerText}
          </p>
        ) : null}

        {/* XP */}
        {hasXp ? (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-cinzel text-4xl leading-none text-accent">+{event.xpDelta}</span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-text-secondary/50">XP</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
