"use client";

import type { Locale } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib";
import { useLocale, useTranslations } from "next-intl";
import {
  getAvatarMonogram,
  getEventBarClass,
  getEventLabelKey,
  getEventPrompt,
} from "./activity-feed-helpers";
import type { LiveFeedEventSnapshot } from "./types";

function formatRelativeTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

function XpBadge({ xp }: { xp: number }) {
  return (
    <span className="font-cinzel ml-auto shrink-0 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
      +{xp} XP
    </span>
  );
}

function EventMeta({
  labelKey,
  createdAt,
}: {
  labelKey: string;
  createdAt: string;
}) {
  const t = useTranslations("LivePage");
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-accent/70">
      <span>{t(labelKey as Parameters<typeof t>[0])}</span>
      <span className="text-accent/35">·</span>
      <span>{formatRelativeTime(createdAt)}</span>
    </div>
  );
}

interface FeedEventCardProps {
  event: LiveFeedEventSnapshot;
}

export function FeedEventCard({ event }: FeedEventCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("LivePage");

  const monogram = getAvatarMonogram(event.avatarKey, event.playerName);
  const labelKey = getEventLabelKey(event.type);
  const barClass = getEventBarClass();
  const prompt = getEventPrompt(event, locale);
  const isContentCard = !!prompt;
  const answer = event.answerI18n?.[locale] ?? event.answerI18n?.uk ?? null;

  const playerName = event.playerName ?? t("anonymous_player");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border pl-5 pr-4 py-4 transition-shadow",
        isContentCard ? "border-accent/18 bg-accent/7" : "border-accent/10 bg-bg-secondary/30",
      )}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 inset-y-3 w-[3px] rounded-full", barClass)} />

      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Avatar monogram */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-cinzel text-sm font-bold text-accent">
          {monogram}
        </div>
        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-medium text-text-primary leading-snug">
            {playerName}
          </p>
          <EventMeta labelKey={labelKey} createdAt={event.createdAt} />
        </div>
        {/* XP badge */}
        {event.xpDelta != null && event.xpDelta > 0 && <XpBadge xp={event.xpDelta} />}
      </div>

      {/* Prompt */}
      {prompt && <p className="mt-3 text-[20px] leading-snug text-text-primary">{prompt}</p>}

      {/* System body (no prompt) */}
      {!prompt && event.type === "player_joined" && (
        <p className="mt-3 text-[18px] text-text-secondary/80">{t("welcome_default")}</p>
      )}

      {/* Answer */}
      {answer && (
        <p className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-2.5 text-[18px] italic text-text-secondary">
          {answer}
        </p>
      )}
    </div>
  );
}
