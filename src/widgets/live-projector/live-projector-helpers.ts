import type { LiveFeedEventSnapshot } from "./types";
import type { SupportedLocale } from "@/shared/config";
import { MOTION_EASE } from "@/shared/lib";

export const MOBILE_FEED_INITIAL_VISIBLE = 8;
export const MOBILE_FEED_LOAD_MORE_STEP = 8;
export const DESKTOP_FEED_INITIAL_VISIBLE = 30;
export const DESKTOP_FEED_LOAD_MORE_STEP = 10;

// Estimated heights in px (including gap-3 = 12px between items)
const LEADERBOARD_ROW_HEIGHT_PX = 68;
const FEED_CARD_ROW_HEIGHT_PX = 180;
// Vertical space taken by header, title cards, padding, gaps
const LAYOUT_CHROME_HEIGHT_PX = 165;

export function getAvatarMonogram(avatarKey: string | null, fallbackName?: string | null) {
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

export function formatCurrentTime(locale: SupportedLocale) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function getEventPrompt(event: LiveFeedEventSnapshot, fallbackLocale: SupportedLocale) {
  const eventLocale = event.locale ?? fallbackLocale;
  return eventLocale === "uk" ? event.promptI18n.uk : event.promptI18n.en;
}

export function getHeroLabelKey(eventType: string | null | undefined) {
  switch (eventType) {
    case "wheel.round.completed": return "event_answered";
    case "wheel.round.promised": return "hero_promised";
    case "leaderboard.new_top_player": return "hero_new_top_player";
    case "player.joined": return "event_player_joined";
    case "xp.awarded": return "event_xp_awarded";
    default: return "hero_generic";
  }
}

export function getEventLabelKey(eventType: string | null | undefined) {
  switch (eventType) {
    case "player.joined": return "event_player_joined";
    case "xp.awarded": return "event_xp_awarded";
    case "wheel.round.completed": return "event_answered";
    case "wheel.round.promised": return "hero_promised";
    case "leaderboard.new_top_player": return "event_new_top_player";
    default: return "event_generic";
  }
}

export function getEventBarClass() {
  return "bg-accent/50";
}

export function computeLiveProjectorLimits(viewportHeight: number) {
  const availableHeight = Math.max(viewportHeight - LAYOUT_CHROME_HEIGHT_PX, 400);

  return {
    leaderboardLimit: Math.max(
      5,
      Math.floor(availableHeight / LEADERBOARD_ROW_HEIGHT_PX)
    ),
    feedLimit: Math.max(
      4,
      Math.floor(availableHeight / FEED_CARD_ROW_HEIGHT_PX) * 2
    ),
  };
}

export const EASE = MOTION_EASE;
