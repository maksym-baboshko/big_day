import type { LiveFeedEventSnapshot } from "@/features/game-session";
import {
  collectUnseenHeroEvents,
  computeLiveProjectorLimits,
  filterQueueableHeroEvents,
  getRealtimeRetryDelay,
  shouldRetryRealtimeStatus,
  trackSeenHeroEventId,
} from "./live-projector-helpers";

function createHeroEvent(id: string): LiveFeedEventSnapshot {
  return {
    id,
    gameSlug: "wheel-of-fortune",
    eventType: "player.joined",
    locale: "en",
    playerId: id,
    playerName: `Player ${id}`,
    avatarKey: "md",
    promptI18n: { uk: null, en: null },
    answerText: null,
    xpDelta: null,
    welcomeText: null,
    isHeroEvent: true,
    createdAt: "2026-03-20T20:00:00.000Z",
  };
}

describe("live-projector helpers", () => {
  it("computes viewport-based limits", () => {
    expect(computeLiveProjectorLimits(1080)).toEqual({
      leaderboardLimit: 13,
      feedLimit: 10,
    });
  });

  it("filters queueable hero events and tracks bounded seen ids", () => {
    const heroOne = createHeroEvent("hero-1");
    const heroTwo = createHeroEvent("hero-2");
    const seenIds = new Set<string>();
    const seenOrder: string[] = [];

    trackSeenHeroEventId(seenIds, seenOrder, "hero-1", 1);
    trackSeenHeroEventId(seenIds, seenOrder, "hero-2", 1);

    expect(Array.from(seenIds)).toEqual(["hero-2"]);
    expect(seenOrder).toEqual(["hero-2"]);

    const queueable = filterQueueableHeroEvents(
      [heroOne, heroTwo],
      "hero-1",
      new Set(["hero-2"])
    );

    expect(queueable).toEqual([]);
  });

  it("collects only unseen hero events", () => {
    const heroOne = createHeroEvent("hero-1");
    const heroTwo = createHeroEvent("hero-2");
    const seenIds = new Set<string>(["hero-1"]);
    const seenOrder = ["hero-1"];

    const unseen = collectUnseenHeroEvents(
      [heroOne, heroTwo],
      seenIds,
      seenOrder
    );

    expect(unseen).toEqual([heroTwo]);
    expect(Array.from(seenIds)).toEqual(["hero-1", "hero-2"]);
  });

  it("calculates capped realtime retry delays", () => {
    expect(getRealtimeRetryDelay(1)).toBe(2_000);
    expect(getRealtimeRetryDelay(2)).toBe(4_000);
    expect(getRealtimeRetryDelay(10)).toBe(30_000);
    expect(shouldRetryRealtimeStatus("CHANNEL_ERROR")).toBe(true);
    expect(shouldRetryRealtimeStatus("TIMED_OUT")).toBe(true);
    expect(shouldRetryRealtimeStatus("CLOSED")).toBe(true);
    expect(shouldRetryRealtimeStatus("SUBSCRIBED")).toBe(false);
  });
});
