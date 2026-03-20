/** @vitest-environment node */

const {
  afterMock,
  enforceRateLimit,
  handleGameApiError,
  runDeferredTasks,
  requireAuthenticatedGameUser,
  bootstrapPlayerProfile,
  savePlayerProfile,
} = vi.hoisted(() => ({
  afterMock: vi.fn((callback: () => void | Promise<void>) => {
    void callback();
  }),
  enforceRateLimit: vi.fn(),
  handleGameApiError: vi.fn(
    (_: unknown, fallbackMessage: string, options?: { requestId?: string }) =>
      Response.json(
        {
          error: fallbackMessage,
          code: "PERSISTENCE_ERROR",
          requestId: options?.requestId ?? "request-unknown",
        },
        { status: 500 }
      )
  ),
  runDeferredTasks: vi.fn().mockResolvedValue(undefined),
  requireAuthenticatedGameUser: vi.fn(),
  bootstrapPlayerProfile: vi.fn(),
  savePlayerProfile: vi.fn(),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");

  return {
    ...actual,
    after: afterMock,
  };
});

vi.mock("@/shared/lib/server", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib/server")>(
      "@/shared/lib/server"
    );

  return {
    ...actual,
    enforceRateLimit,
    handleGameApiError,
    runDeferredTasks,
  };
});

vi.mock("@/features/game-session/server", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/game-session/server")>(
      "@/features/game-session/server"
    );

  return {
    ...actual,
    bootstrapPlayerProfile,
    requireAuthenticatedGameUser,
    savePlayerProfile,
  };
});

import { GET, POST } from "./route";

describe("GET /api/games/player", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedGameUser.mockResolvedValue({ id: "user-1" });
    bootstrapPlayerProfile.mockResolvedValue({ playerId: "player-1" });
    savePlayerProfile.mockResolvedValue({
      player: { playerId: "player-1" },
      deferredTasks: [{ label: "task", run: async () => {} }],
    });
  });

  it("enforces the read rate limit and returns the player snapshot", async () => {
    const response = await GET(
      new Request("http://localhost/api/games/player?locale=uk")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      player: { playerId: "player-1" },
    });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "games.player.read",
        authUserId: "user-1",
      })
    );
    expect(bootstrapPlayerProfile).toHaveBeenCalledWith({
      authUserId: "user-1",
      locale: "uk",
    });
  });

  it("validates the POST payload before saving", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-player-save-invalid",
        },
        body: JSON.stringify({
          nickname: "",
          locale: "uk",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid player payload.",
      code: "INVALID_DATA",
      requestId: "request-player-save-invalid",
    });
    expect(savePlayerProfile).not.toHaveBeenCalled();
  });

  it("rejects malformed POST JSON before saving", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-player-save-malformed",
        },
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid player payload.",
      code: "INVALID_DATA",
      requestId: "request-player-save-malformed",
    });
    expect(savePlayerProfile).not.toHaveBeenCalled();
  });

  it("runs deferred tasks after a successful save", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-player-save",
        },
        body: JSON.stringify({
          nickname: "  Maksym   B  ",
          locale: "en",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(savePlayerProfile).toHaveBeenCalledWith({
      authUserId: "user-1",
      nickname: "Maksym B",
      locale: "en",
    });
    expect(afterMock).toHaveBeenCalledTimes(1);
    expect(runDeferredTasks).toHaveBeenCalledTimes(1);
  });
});
