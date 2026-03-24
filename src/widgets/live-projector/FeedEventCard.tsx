"use client";

import { useTranslations } from "next-intl";
import type { LiveFeedEventSnapshot } from "./types";
import type { SupportedLocale } from "@/shared/config";
import { cn } from "@/shared/lib";
import {
  getAvatarMonogram,
  getEventBarClass,
  getEventLabelKey,
  getEventPrompt,
} from "./live-projector-helpers";

function EventMeta({
  eventLabelKey,
  gameTitle,
  createdAt,
  locale,
  t,
}: {
  eventLabelKey: string;
  gameTitle: string | null;
  createdAt: string;
  locale: SupportedLocale;
  t: ReturnType<typeof useTranslations>;
}) {
  const parsed = new Date(createdAt);
  const time = !isNaN(parsed.getTime())
    ? parsed.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-accent">
      {t(eventLabelKey)}
      {gameTitle ? (
        <>
          <span className="mx-1.5 text-accent/55">•</span>
          <span className="text-text-secondary/75">{gameTitle}</span>
        </>
      ) : null}
      {time ? (
        <>
          <span className="mx-1.5 text-accent/55">•</span>
          <span className="text-text-secondary/75">{time}</span>
        </>
      ) : null}
    </p>
  );
}

function XpBadge({ xpDelta }: { xpDelta: number }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1">
      <span className="font-cinzel text-2xl leading-none text-accent">
        +{xpDelta}
      </span>
      <span className="font-cinzel text-[9px] uppercase tracking-[0.2em] text-text-secondary/80">
        XP
      </span>
    </div>
  );
}

export function FeedEventCard({
  event,
  locale,
}: {
  event: LiveFeedEventSnapshot;
  locale: SupportedLocale;
}) {
  const t = useTranslations("LivePage");
  const prompt = getEventPrompt(event, locale);
  const gameTitle = null; // will be populated when new games platform is wired up
  const eventLabelKey = getEventLabelKey(event.eventType);
  const barClass = getEventBarClass();

  const hasXp =
    event.xpDelta != null &&
    event.xpDelta !== 0 &&
    event.eventType !== "leaderboard.new_top_player";

  const playerName = event.playerName ?? t("anonymous_player");

  // Body text for system events (no prompt)
  const systemBody = !prompt
    ? event.eventType === "player.joined"
      ? (event.welcomeText ?? t("welcome_default"))
      : event.eventType === "leaderboard.new_top_player"
        ? t("new_top_player_note")
        : null
    : null;

  // Content cards (with prompt) get accent background; system event cards get neutral
  const isContentCard = !!prompt;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl shadow-[0_12px_28px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        isContentCard
          ? "border border-accent/18 bg-accent/7"
          : "border border-accent/10 bg-bg-secondary/30",
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-[3px] rounded-l-3xl", barClass)} />

      <div className="py-4 pl-7 pr-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/22 bg-accent/10 font-cinzel text-xs tracking-[0.14em] text-accent">
            {getAvatarMonogram(event.avatarKey, event.playerName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-medium leading-tight text-text-primary">
              {playerName}
            </p>
            <EventMeta
              eventLabelKey={eventLabelKey}
              gameTitle={gameTitle}
              createdAt={event.createdAt}
              locale={locale}
              t={t}
            />
          </div>
          {hasXp && <XpBadge xpDelta={event.xpDelta!} />}
        </div>

        {/* Prompt (content events) */}
        {prompt ? (
          <p className="mt-3 text-[20px] font-normal leading-snug text-text-primary">
            {prompt}
          </p>
        ) : systemBody ? (
          /* System message body (player.joined, leaderboard.new_top_player, etc.) */
          <p className="mt-3 text-[18px] leading-relaxed text-text-secondary/80">
            {systemBody}
          </p>
        ) : null}

        {/* Answer bubble */}
        {event.answerText ? (
          <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-2.5">
            <p className="text-[18px] italic leading-snug text-text-primary/75">
              — {event.answerText}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
