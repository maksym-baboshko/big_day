"use client";

import { resolveLocale } from "@/shared/i18n/routing";
import type { Locale } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib";
import { SurfacePanel } from "@/shared/ui";
import { useLocale, useTranslations } from "next-intl";
import {
  formatEventTime,
  getAvatarMonogram,
  getEventBarClass,
  getEventLabelKey,
  getEventPrompt,
  getGameTitle,
} from "./activity-feed-helpers";
import type { FeedEventSnapshot } from "./types";

function XpBadge({ xpDelta }: { xpDelta: number }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1">
      <span className="font-cinzel text-2xl leading-none text-accent">+{xpDelta}</span>
      <span className="font-cinzel text-[9px] uppercase tracking-[0.2em] text-text-secondary/80">
        XP
      </span>
    </div>
  );
}

function EventMeta({
  eventLabelKey,
  gameTitle,
  createdAt,
  locale,
}: {
  eventLabelKey: string;
  gameTitle: string | null;
  createdAt: string;
  locale: Locale;
}) {
  const t = useTranslations("ActivityFeedPage");
  const time = formatEventTime(createdAt, locale);

  return (
    <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-accent">
      {t(eventLabelKey as Parameters<typeof t>[0])}
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

interface FeedEventCardProps {
  event: FeedEventSnapshot;
}

export function FeedEventCard({ event }: FeedEventCardProps) {
  const locale = resolveLocale(useLocale());
  const t = useTranslations("ActivityFeedPage");
  const prompt = getEventPrompt(event, locale);
  const gameTitle = getGameTitle(event.gameSlug, locale);
  const eventLabelKey = getEventLabelKey(event.type);
  const barClass = getEventBarClass(event.type);
  const answer = event.answerI18n?.[locale] ?? event.answerI18n?.uk ?? null;
  const hasXp = event.xpDelta != null && event.xpDelta !== 0 && event.type !== "new_top_player";
  const playerName = event.playerName ?? t("anonymous_player");
  const systemBody = !prompt
    ? event.type === "player_joined"
      ? t("welcome_default")
      : event.type === "new_top_player"
        ? t("new_top_player_note")
        : null
    : null;

  return (
    <SurfacePanel
      data-testid="feed-event-card"
      data-event-id={event.id}
      className={cn("relative", prompt ? "bg-accent/7" : "bg-bg-secondary/30")}
      contentClassName="py-4 pl-7 pr-5"
      tone={prompt ? "highlighted" : "subtle"}
    >
      <div className={cn("absolute inset-y-0 left-0 w-[3px] rounded-l-[inherit]", barClass)} />

      <div className={cn("relative", prompt ? "text-text-primary" : "text-text-primary")}>
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
            />
          </div>

          {hasXp ? <XpBadge xpDelta={event.xpDelta ?? 0} /> : null}
        </div>

        {prompt ? (
          <p className="mt-3 text-[20px] font-normal leading-snug text-text-primary">{prompt}</p>
        ) : systemBody ? (
          <p className="mt-3 text-[18px] leading-relaxed text-text-secondary/80">{systemBody}</p>
        ) : null}

        {answer ? (
          <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-2.5">
            <p className="text-[18px] italic leading-snug text-text-primary/75">— {answer}</p>
          </div>
        ) : null}
      </div>
    </SurfacePanel>
  );
}
