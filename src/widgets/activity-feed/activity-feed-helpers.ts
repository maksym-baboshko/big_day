import type { Locale } from "@/shared/i18n/routing";
import { MOTION_EASE } from "@/shared/lib";
import type { FeedEventSnapshot, FeedEventType } from "./types";

export const HERO_EVENT_DURATION_MS = 5_000;
export const LIVE_POLL_INTERVAL_MS = 30_000;
export const LIVE_REALTIME_RETRY_BASE_MS = 2_000;
export const LIVE_REALTIME_RETRY_MAX_MS = 30_000;
export const MOBILE_FEED_INITIAL_VISIBLE = 8;
export const MOBILE_FEED_LOAD_MORE_STEP = 8;
export const DESKTOP_FEED_INITIAL_VISIBLE = 30;
export const DESKTOP_FEED_LOAD_MORE_STEP = 10;
export const SEEN_HERO_IDS_MAX = 200;
export const EASE = MOTION_EASE;

export function getVisibleFeed<T>(feed: T[], visibleCount: number): T[] {
  return feed.slice(0, Math.max(0, visibleCount));
}

export function splitFeedIntoColumns<T>(items: T[]): { left: T[]; right: T[] } {
  return items.reduce(
    (columns, item, index) => {
      if (index % 2 === 0) {
        columns.left.push(item);
      } else {
        columns.right.push(item);
      }

      return columns;
    },
    { left: [] as T[], right: [] as T[] },
  );
}

export function hasMoreFeedForViewport(totalCount: number, visibleCount: number): boolean {
  return totalCount > visibleCount;
}

export function getAvatarMonogram(avatarKey: string | null, fallbackName: string | null): string {
  if (avatarKey) {
    const parts = avatarKey.split("-").filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    if (initials) {
      return initials;
    }
  }

  if (fallbackName) {
    const firstLetter = fallbackName.trim()[0]?.toUpperCase();

    if (firstLetter) {
      return firstLetter;
    }
  }

  return "•";
}

export function formatEventTime(value: string, locale: Locale): string | null {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getGameTitle(gameSlug: string | null, _locale: Locale): string | null {
  if (!gameSlug) {
    return null;
  }

  return gameSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getEventLabelKey(type: FeedEventType): string {
  const map: Record<FeedEventType, string> = {
    player_joined: "event_player_joined",
    xp_awarded: "event_xp_awarded",
    answered: "event_answered",
    promised: "event_promised",
    new_top_player: "event_new_top_player",
  };

  return map[type] ?? "event_generic";
}

export function getHeroLabelKey(type: FeedEventType): string {
  const map: Record<FeedEventType, string> = {
    player_joined: "hero_generic",
    xp_awarded: "hero_generic",
    answered: "hero_generic",
    promised: "hero_promised",
    new_top_player: "hero_new_top_player",
  };

  return map[type] ?? "hero_generic";
}

export function getEventBarClass(_type?: FeedEventType): string {
  return "bg-accent/50";
}

export function getEventPrompt(
  event: { promptI18n: Record<string, string> | null },
  locale: string,
): string | null {
  if (!event.promptI18n) {
    return null;
  }

  return event.promptI18n[locale] ?? event.promptI18n.uk ?? null;
}

const HERO_TYPES: Set<FeedEventType> = new Set(["promised", "new_top_player"]);

export function filterQueueableHeroEvents(
  events: FeedEventSnapshot[],
  activeHeroEventId: string | null = null,
  queuedHeroIds: Set<string> = new Set<string>(),
): FeedEventSnapshot[] {
  return events.filter(
    (event) =>
      HERO_TYPES.has(event.type) && event.id !== activeHeroEventId && !queuedHeroIds.has(event.id),
  );
}

export function collectUnseenHeroEvents(
  events: FeedEventSnapshot[],
  seenIds: Set<string>,
  seenOrder: string[],
  max = SEEN_HERO_IDS_MAX,
): FeedEventSnapshot[] {
  const unseenHeroEvents: FeedEventSnapshot[] = [];

  for (const event of filterQueueableHeroEvents(events)) {
    if (seenIds.has(event.id)) {
      continue;
    }

    trackSeenHeroEventId(seenIds, seenOrder, event.id, max);
    unseenHeroEvents.push(event);
  }

  return unseenHeroEvents;
}

export function trackSeenHeroEventId(
  seenIds: Set<string>,
  seenOrder: string[],
  id: string,
  max = SEEN_HERO_IDS_MAX,
): void {
  if (seenIds.has(id)) {
    return;
  }

  seenIds.add(id);
  seenOrder.push(id);

  while (seenOrder.length > max) {
    const oldestId = seenOrder.shift();

    if (oldestId) {
      seenIds.delete(oldestId);
    }
  }
}

export function shouldRetryRealtimeStatus(status: string): boolean {
  return status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED";
}

export function getRealtimeRetryDelay(attempt: number): number {
  const normalizedAttempt = Math.max(1, attempt);

  return Math.min(
    LIVE_REALTIME_RETRY_BASE_MS * 2 ** (normalizedAttempt - 1),
    LIVE_REALTIME_RETRY_MAX_MS,
  );
}
