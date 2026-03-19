import type { LiveFeedEventSnapshot } from "@/features/game-session";
import { getGameBySlug } from "@/shared/config";
import type { SupportedLocale } from "@/shared/config";

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

export function formatEventTime(value: string, locale: SupportedLocale) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

export function getGameTitle(gameSlug: LiveFeedEventSnapshot["gameSlug"], locale: SupportedLocale) {
  const game = getGameBySlug(gameSlug);
  if (!game) return null;
  return locale === "uk" ? game.title.uk : game.title.en;
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
    case "wheel.round.promised": return "event_promised";
    case "leaderboard.new_top_player": return "event_new_top_player";
    default: return "event_generic";
  }
}

export function getEventBarClass(eventType: string | null | undefined) {
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

export const EASE = [0.22, 1, 0.36, 1] as const;
