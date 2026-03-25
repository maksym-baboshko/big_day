import { MOTION_EASE } from "@/shared/lib";

// ─── Timing constants ───────────────────────────────────────────────────────

export const HERO_EVENT_DURATION_MS = 5_000;
export const LIVE_POLL_INTERVAL_MS = 30_000;

export const MOBILE_FEED_INITIAL_VISIBLE = 8;
export const MOBILE_FEED_LOAD_MORE_STEP = 8;
export const DESKTOP_FEED_INITIAL_VISIBLE = 30;
export const DESKTOP_FEED_LOAD_MORE_STEP = 10;

export const SEEN_HERO_IDS_MAX = 200;

// Re-export motion ease as EASE for convenience in this widget
export const EASE = MOTION_EASE;

// ─── Avatar monogram ─────────────────────────────────────────────────────────

/**
 * Derives a 1–2 char monogram from `avatarKey` (e.g. "john-doe" → "JD")
 * falling back to the first char of `fallbackName` or "•".
 */
export function getAvatarMonogram(avatarKey: string | null, fallbackName: string | null): string {
  if (avatarKey) {
    const parts = avatarKey.split("-").filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    if (initials) return initials;
  }
  if (fallbackName) {
    const first = fallbackName.trim()[0]?.toUpperCase();
    if (first) return first;
  }
  return "•";
}

// ─── Event display helpers ───────────────────────────────────────────────────

import type { LiveFeedEventType } from "./types";

/** Returns the i18n key for the feed card label. */
export function getEventLabelKey(type: LiveFeedEventType): string {
  const map: Record<LiveFeedEventType, string> = {
    player_joined: "event_player_joined",
    xp_awarded: "event_xp_awarded",
    answered: "event_answered",
    promised: "event_promised",
    new_top_player: "event_new_top_player",
  };
  return map[type] ?? "event_generic";
}

/** Returns the i18n key for the hero event overlay label. */
export function getHeroLabelKey(type: LiveFeedEventType): string {
  const map: Record<LiveFeedEventType, string> = {
    player_joined: "hero_generic",
    xp_awarded: "hero_generic",
    answered: "hero_generic",
    promised: "hero_promised",
    new_top_player: "hero_new_top_player",
  };
  return map[type] ?? "hero_generic";
}

/** Always returns the same accent bar class (uniform look). */
export function getEventBarClass(): string {
  return "bg-accent/50";
}

/** Returns the localized prompt text for an event, if any. */
export function getEventPrompt(
  event: { promptI18n: Record<string, string> | null },
  locale: string,
): string | null {
  if (!event.promptI18n) return null;
  return event.promptI18n[locale] ?? event.promptI18n.uk ?? null;
}

// ─── Hero event queue helpers ─────────────────────────────────────────────────

import type { LiveFeedEventSnapshot } from "./types";

const HERO_TYPES: Set<LiveFeedEventType> = new Set(["promised", "new_top_player"]);

export function filterQueueableHeroEvents(
  events: LiveFeedEventSnapshot[],
): LiveFeedEventSnapshot[] {
  return events.filter((e) => HERO_TYPES.has(e.type as LiveFeedEventType));
}

export function collectUnseenHeroEvents(
  events: LiveFeedEventSnapshot[],
  seenIds: Set<string>,
): LiveFeedEventSnapshot[] {
  return filterQueueableHeroEvents(events).filter((e) => !seenIds.has(e.id));
}

export function trackSeenHeroEventId(seenIds: Set<string>, id: string, max: number): void {
  seenIds.add(id);
  if (seenIds.size > max) {
    const [first] = seenIds;
    if (first) seenIds.delete(first);
  }
}
