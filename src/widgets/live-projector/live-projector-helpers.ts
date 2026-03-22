import type { LiveFeedEventSnapshot } from "@/features/game-session";
import { getGameBySlug } from "@/shared/config";
import type { SupportedLocale } from "@/shared/config";
import { MOTION_EASE } from "@/shared/lib";

export const HERO_EVENT_DURATION_MS = 5000;
export const LIVE_POLL_INTERVAL_MS = 30_000;
export const MOBILE_FEED_INITIAL_VISIBLE = 8;
export const MOBILE_FEED_LOAD_MORE_STEP = 8;
export const DESKTOP_FEED_INITIAL_VISIBLE = 30;
export const DESKTOP_FEED_LOAD_MORE_STEP = 10;
export const LIVE_REALTIME_RETRY_BASE_MS = 2_000;
export const LIVE_REALTIME_RETRY_MAX_MS = 30_000;
export const SEEN_HERO_IDS_MAX = 200;

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
    case "wheel.round.promised": return "hero_promised";
    case "leaderboard.new_top_player": return "event_new_top_player";
    default: return "event_generic";
  }
}

export function getEventBarClass(_eventType: string | null | undefined) {
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

export function filterQueueableHeroEvents(
  nextHeroEvents: LiveFeedEventSnapshot[],
  activeHeroEventId: string | null,
  queuedHeroIds: Set<string>
): LiveFeedEventSnapshot[] {
  return nextHeroEvents.filter(
    (event) => event.id !== activeHeroEventId && !queuedHeroIds.has(event.id)
  );
}

export function trackSeenHeroEventId(
  seenIds: Set<string>,
  seenOrder: string[],
  id: string,
  maxSeenIds = SEEN_HERO_IDS_MAX
): void {
  seenIds.add(id);
  seenOrder.push(id);

  while (seenOrder.length > maxSeenIds) {
    const oldestId = seenOrder.shift();

    if (oldestId) {
      seenIds.delete(oldestId);
    }
  }
}

export function collectUnseenHeroEvents(
  nextHeroEvents: LiveFeedEventSnapshot[],
  seenIds: Set<string>,
  seenOrder: string[],
  maxSeenIds = SEEN_HERO_IDS_MAX
): LiveFeedEventSnapshot[] {
  const unseenHeroEvents: LiveFeedEventSnapshot[] = [];

  for (const event of nextHeroEvents) {
    if (seenIds.has(event.id)) {
      continue;
    }

    trackSeenHeroEventId(seenIds, seenOrder, event.id, maxSeenIds);
    unseenHeroEvents.push(event);
  }

  return unseenHeroEvents;
}

export function shouldRetryRealtimeStatus(status: string): boolean {
  return (
    status === "CHANNEL_ERROR" ||
    status === "TIMED_OUT" ||
    status === "CLOSED"
  );
}

export function getRealtimeRetryDelay(attempt: number): number {
  const normalizedAttempt = Math.max(1, attempt);

  return Math.min(
    LIVE_REALTIME_RETRY_BASE_MS * 2 ** (normalizedAttempt - 1),
    LIVE_REALTIME_RETRY_MAX_MS
  );
}

export const EASE = MOTION_EASE;
