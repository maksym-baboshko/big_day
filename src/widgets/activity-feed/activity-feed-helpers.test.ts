import { describe, expect, it } from "vitest";
import {
  collectUnseenHeroEvents,
  filterQueueableHeroEvents,
  getAvatarMonogram,
  getEventBarClass,
  getEventLabelKey,
  getEventPrompt,
  getHeroLabelKey,
  getRealtimeRetryDelay,
  getVisibleFeed,
  hasMoreFeedForViewport,
  shouldRetryRealtimeStatus,
  splitFeedIntoColumns,
  trackSeenHeroEventId,
} from "./activity-feed-helpers";
import type { FeedEventSnapshot } from "./types";

// ─── getAvatarMonogram ────────────────────────────────────────────────────────

describe("getAvatarMonogram", () => {
  it("extracts up to 2 initials from avatarKey", () => {
    expect(getAvatarMonogram("john-doe", null)).toBe("JD");
  });

  it("takes only the first two parts when there are more", () => {
    expect(getAvatarMonogram("anna-maria-kowalska", null)).toBe("AM");
  });

  it("handles single-part avatarKey", () => {
    expect(getAvatarMonogram("single", null)).toBe("S");
  });

  it("falls back to first char of fallbackName when avatarKey is null", () => {
    expect(getAvatarMonogram(null, "Олена")).toBe("О");
  });

  it("falls back to fallbackName when avatarKey is empty string", () => {
    expect(getAvatarMonogram("", "Fallback")).toBe("F");
  });

  it("returns bullet when both are null", () => {
    expect(getAvatarMonogram(null, null)).toBe("•");
  });

  it("returns bullet when avatarKey is empty and fallbackName is empty", () => {
    expect(getAvatarMonogram("", "")).toBe("•");
  });
});

// ─── getEventLabelKey ─────────────────────────────────────────────────────────

describe("getEventLabelKey", () => {
  it.each([
    ["player_joined", "event_player_joined"],
    ["xp_awarded", "event_xp_awarded"],
    ["answered", "event_answered"],
    ["promised", "event_promised"],
    ["new_top_player", "event_new_top_player"],
  ] as const)("maps %s → %s", (type, expected) => {
    expect(getEventLabelKey(type)).toBe(expected);
  });
});

// ─── getHeroLabelKey ──────────────────────────────────────────────────────────

describe("getHeroLabelKey", () => {
  it("maps new_top_player to hero_new_top_player", () => {
    expect(getHeroLabelKey("new_top_player")).toBe("hero_new_top_player");
  });

  it("maps promised to hero_promised", () => {
    expect(getHeroLabelKey("promised")).toBe("hero_promised");
  });

  it("maps other types to hero_generic", () => {
    expect(getHeroLabelKey("player_joined")).toBe("hero_generic");
    expect(getHeroLabelKey("xp_awarded")).toBe("hero_generic");
    expect(getHeroLabelKey("answered")).toBe("hero_generic");
  });
});

// ─── getEventBarClass ─────────────────────────────────────────────────────────

describe("getEventBarClass", () => {
  it("always returns bg-accent/50", () => {
    expect(getEventBarClass()).toBe("bg-accent/50");
  });
});

// ─── getEventPrompt ───────────────────────────────────────────────────────────

describe("getEventPrompt", () => {
  it("returns prompt for the requested locale", () => {
    const event = { promptI18n: { uk: "Питання?", en: "Question?" } };
    expect(getEventPrompt(event, "en")).toBe("Question?");
    expect(getEventPrompt(event, "uk")).toBe("Питання?");
  });

  it("falls back to uk when requested locale is missing", () => {
    const event = { promptI18n: { uk: "Питання?" } };
    expect(getEventPrompt(event, "de")).toBe("Питання?");
  });

  it("returns null when promptI18n is null", () => {
    expect(getEventPrompt({ promptI18n: null }, "uk")).toBeNull();
  });
});

// ─── filterQueueableHeroEvents ────────────────────────────────────────────────

const makeEvent = (id: string, type: FeedEventSnapshot["type"]): FeedEventSnapshot => ({
  id,
  type,
  playerId: null,
  avatarKey: null,
  playerName: null,
  gameSlug: null,
  promptI18n: null,
  answerI18n: null,
  xpDelta: null,
  createdAt: new Date().toISOString(),
});

describe("filterQueueableHeroEvents", () => {
  it("keeps only promised and new_top_player events", () => {
    const events: FeedEventSnapshot[] = [
      makeEvent("1", "player_joined"),
      makeEvent("2", "promised"),
      makeEvent("3", "new_top_player"),
      makeEvent("4", "xp_awarded"),
      makeEvent("5", "answered"),
    ];
    const result = filterQueueableHeroEvents(events);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["2", "3"]);
  });

  it("skips the active hero event and already queued ids", () => {
    const events: FeedEventSnapshot[] = [
      makeEvent("1", "promised"),
      makeEvent("2", "new_top_player"),
      makeEvent("3", "promised"),
    ];

    const result = filterQueueableHeroEvents(events, "1", new Set(["2"]));

    expect(result.map((event) => event.id)).toEqual(["3"]);
  });

  it("returns empty array when no queueable events", () => {
    expect(filterQueueableHeroEvents([makeEvent("1", "player_joined")])).toHaveLength(0);
  });
});

// ─── collectUnseenHeroEvents ──────────────────────────────────────────────────

describe("collectUnseenHeroEvents", () => {
  it("returns only queueable events not in seenIds", () => {
    const events: FeedEventSnapshot[] = [
      makeEvent("1", "promised"),
      makeEvent("2", "new_top_player"),
      makeEvent("3", "promised"),
    ];
    const seen = new Set(["1"]);
    const seenOrder = ["1"];
    const result = collectUnseenHeroEvents(events, seen, seenOrder);
    expect(result.map((e) => e.id)).toEqual(["2", "3"]);
  });

  it("returns empty array when all are seen", () => {
    const events = [makeEvent("1", "promised")];
    expect(collectUnseenHeroEvents(events, new Set(["1"]), ["1"])).toHaveLength(0);
  });

  it("tracks newly seen ids in insertion order", () => {
    const seen = new Set<string>();
    const seenOrder: string[] = [];

    collectUnseenHeroEvents(
      [makeEvent("2", "promised"), makeEvent("3", "new_top_player")],
      seen,
      seenOrder,
    );

    expect(seenOrder).toEqual(["2", "3"]);
    expect([...seen]).toEqual(["2", "3"]);
  });
});

// ─── trackSeenHeroEventId ─────────────────────────────────────────────────────

describe("trackSeenHeroEventId", () => {
  it("adds an id to the set", () => {
    const seen = new Set<string>();
    const seenOrder: string[] = [];
    trackSeenHeroEventId(seen, seenOrder, "abc", 10);
    expect(seen.has("abc")).toBe(true);
    expect(seenOrder).toEqual(["abc"]);
  });

  it("evicts the oldest id when the set exceeds max", () => {
    const seen = new Set(["first", "second"]);
    const seenOrder = ["first", "second"];
    trackSeenHeroEventId(seen, seenOrder, "third", 2);
    expect(seen.has("first")).toBe(false);
    expect(seen.has("second")).toBe(true);
    expect(seen.has("third")).toBe(true);
    expect(seen.size).toBe(2);
    expect(seenOrder).toEqual(["second", "third"]);
  });

  it("does not evict when under max", () => {
    const seen = new Set(["a"]);
    const seenOrder = ["a"];
    trackSeenHeroEventId(seen, seenOrder, "b", 5);
    expect(seen.size).toBe(2);
    expect(seen.has("a")).toBe(true);
    expect(seenOrder).toEqual(["a", "b"]);
  });

  it("does not duplicate ids that are already tracked", () => {
    const seen = new Set(["a"]);
    const seenOrder = ["a"];

    trackSeenHeroEventId(seen, seenOrder, "a", 5);

    expect(seenOrder).toEqual(["a"]);
    expect(seen.size).toBe(1);
  });
});

describe("shouldRetryRealtimeStatus", () => {
  it("retries channel failures", () => {
    expect(shouldRetryRealtimeStatus("CHANNEL_ERROR")).toBe(true);
    expect(shouldRetryRealtimeStatus("TIMED_OUT")).toBe(true);
    expect(shouldRetryRealtimeStatus("CLOSED")).toBe(true);
  });

  it("ignores healthy realtime statuses", () => {
    expect(shouldRetryRealtimeStatus("SUBSCRIBED")).toBe(false);
    expect(shouldRetryRealtimeStatus("JOINING")).toBe(false);
  });
});

describe("getRealtimeRetryDelay", () => {
  it("applies exponential backoff", () => {
    expect(getRealtimeRetryDelay(1)).toBe(2000);
    expect(getRealtimeRetryDelay(2)).toBe(4000);
    expect(getRealtimeRetryDelay(3)).toBe(8000);
  });

  it("caps the retry delay", () => {
    expect(getRealtimeRetryDelay(10)).toBe(30000);
  });
});

describe("getVisibleFeed", () => {
  it("returns only the requested number of visible events", () => {
    expect(getVisibleFeed(["a", "b", "c", "d"], 2)).toEqual(["a", "b"]);
  });

  it("returns an empty array when visible count is negative", () => {
    expect(getVisibleFeed(["a", "b"], -1)).toEqual([]);
  });
});

describe("splitFeedIntoColumns", () => {
  it("splits feed items into alternating desktop columns", () => {
    expect(splitFeedIntoColumns(["a", "b", "c", "d", "e"])).toEqual({
      left: ["a", "c", "e"],
      right: ["b", "d"],
    });
  });

  it("returns empty columns for an empty feed", () => {
    expect(splitFeedIntoColumns([])).toEqual({ left: [], right: [] });
  });
});

describe("hasMoreFeedForViewport", () => {
  it("returns true when total feed count exceeds visible count", () => {
    expect(hasMoreFeedForViewport(12, 8)).toBe(true);
  });

  it("returns false when all feed items are already visible", () => {
    expect(hasMoreFeedForViewport(8, 8)).toBe(false);
    expect(hasMoreFeedForViewport(4, 8)).toBe(false);
  });
});
