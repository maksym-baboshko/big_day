import { act, renderHook, waitFor } from "@testing-library/react";
import type { LiveFeedEventSnapshot, LivePageApiResponse } from "@/features/game-session";
import { useLiveProjectorSnapshot } from "./useLiveProjectorSnapshot";

const {
  channelFactoryMock,
  channelMock,
  getSupabaseBrowserClient,
  getSubscribeCallback,
  reinstallChannelMock,
  removeChannelMock,
  resetSubscribeCallback,
} = vi.hoisted(() => {
  let subscribeCallback: ((status: string) => void) | null = null;
  const channelMock = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };

  const reinstallChannelMock = () => {
    channelMock.on.mockReturnValue(channelMock);
    channelMock.subscribe.mockImplementation((callback: (status: string) => void) => {
      subscribeCallback = callback;
      return channelMock;
    });
  };

  reinstallChannelMock();

  const channelFactoryMock = vi.fn(() => channelMock);
  const removeChannelMock = vi.fn().mockResolvedValue(undefined);
  const getSupabaseBrowserClient = vi.fn(() => ({
    channel: channelFactoryMock,
    removeChannel: removeChannelMock,
  }));

  return {
    channelFactoryMock,
    channelMock,
    getSupabaseBrowserClient,
    getSubscribeCallback: () => subscribeCallback,
    reinstallChannelMock,
    removeChannelMock,
    resetSubscribeCallback: () => {
      subscribeCallback = null;
    },
  };
});

vi.mock("@/features/game-session", () => ({
  getSupabaseBrowserClient,
}));

vi.mock("./live-projector-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./live-projector-helpers")>();

  return {
    ...actual,
    LIVE_POLL_INTERVAL_MS: 200,
    LIVE_REALTIME_RETRY_BASE_MS: 20,
    LIVE_REALTIME_RETRY_MAX_MS: 100,
    getRealtimeRetryDelay: (attempt: number) =>
      Math.min(20 * 2 ** (Math.max(1, attempt) - 1), 100),
  };
});

const originalFetch = globalThis.fetch;

function createHeroEvent(id: string): LiveFeedEventSnapshot {
  return {
    id,
    gameSlug: "wheel-of-fortune",
    eventType: "leaderboard.new_top_player",
    locale: "en",
    playerId: id,
    playerName: `Player ${id}`,
    avatarKey: "md",
    promptI18n: { uk: null, en: null },
    answerText: null,
    xpDelta: 10,
    welcomeText: null,
    isHeroEvent: true,
    createdAt: "2026-03-20T20:00:00.000Z",
  };
}

function createSnapshot(
  overrides: Partial<LivePageApiResponse> = {}
): LivePageApiResponse {
  return {
    leaderboard: [],
    feed: [],
    ...overrides,
  };
}

function createJsonResponse(payload: LivePageApiResponse, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function stubFetch(fetchMock: ReturnType<typeof vi.fn>): void {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: fetchMock,
  });
  Object.defineProperty(window, "fetch", {
    configurable: true,
    value: fetchMock,
  });
}

describe("useLiveProjectorSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reinstallChannelMock();
    resetSubscribeCallback();
    stubFetch(vi.fn().mockResolvedValue(createJsonResponse(createSnapshot())));
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1080,
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: originalFetch,
    });
    Object.defineProperty(window, "fetch", {
      configurable: true,
      value: originalFetch,
    });
  });

  it("loads immediately, refreshes on subscribe, polling, and visibility changes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(createSnapshot()));
    stubFetch(fetchMock);

    renderHook(() => useLiveProjectorSnapshot());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getSubscribeCallback()).toBeTypeOf("function");
    });

    act(() => {
      getSubscribeCallback()?.("SUBSCRIBED");
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });

  it("retries realtime subscriptions with backoff while polling continues", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(createSnapshot()));
    stubFetch(fetchMock);

    renderHook(() => useLiveProjectorSnapshot());

    await waitFor(() => {
      expect(channelFactoryMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getSubscribeCallback()).toBeTypeOf("function");
    });

    act(() => {
      getSubscribeCallback()?.("CHANNEL_ERROR");
    });

    await waitFor(() => {
      expect(removeChannelMock).toHaveBeenCalledWith(channelMock);
    });

    await waitFor(() => {
      expect(channelFactoryMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("deduplicates hero events across reconnect refreshes", async () => {
    const heroOne = createHeroEvent("hero-1");
    const heroTwo = createHeroEvent("hero-2");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse(createSnapshot({ feed: [heroOne] })))
      .mockResolvedValueOnce(createJsonResponse(createSnapshot({ feed: [heroOne] })))
      .mockResolvedValueOnce(
        createJsonResponse(createSnapshot({ feed: [heroOne, heroTwo] }))
      );
    stubFetch(fetchMock);

    const { result } = renderHook(() => useLiveProjectorSnapshot());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.heroEvent).toBeNull();
      expect(getSubscribeCallback()).toBeTypeOf("function");
    });

    act(() => {
      getSubscribeCallback()?.("SUBSCRIBED");
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.heroEvent).toBeNull();
    });

    act(() => {
      getSubscribeCallback()?.("SUBSCRIBED");
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.current.heroEvent?.id).toBe("hero-2");
    });
  });
});
