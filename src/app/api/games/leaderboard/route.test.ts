/** @vitest-environment node */

const {
  enforceRateLimit,
  handleGameApiError,
  getGameLeaderboard,
  requireAuthenticatedGameUser,
} = vi.hoisted(() => ({
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
  getGameLeaderboard: vi.fn(),
  requireAuthenticatedGameUser: vi.fn(),
}));

vi.mock("@/shared/lib/server", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib/server")>(
      "@/shared/lib/server"
    );

  return {
    ...actual,
    enforceRateLimit,
    handleGameApiError,
  };
});

vi.mock("@/features/game-session/server", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/game-session/server")>(
      "@/features/game-session/server"
    );

  return {
    ...actual,
    getGameLeaderboard,
    requireAuthenticatedGameUser,
  };
});

import { GET } from "./route";

describe("GET /api/games/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedGameUser.mockResolvedValue({ id: "user-1" });
    getGameLeaderboard.mockResolvedValue([{ playerId: "player-1", rank: 1 }]);
  });

  it("validates the leaderboard query", async () => {
    const response = await GET(
      new Request("http://localhost/api/games/leaderboard?game=unknown", {
        headers: {
          "x-request-id": "request-leaderboard-invalid",
        },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid leaderboard query.",
      code: "INVALID_DATA",
      requestId: "request-leaderboard-invalid",
    });
    expect(getGameLeaderboard).not.toHaveBeenCalled();
  });

  it("enforces the read rate limit and returns the leaderboard snapshot", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/games/leaderboard?game=wheel-of-fortune&topLimit=5&radius=2"
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      leaderboard: [{ playerId: "player-1", rank: 1 }],
    });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "games.leaderboard.read",
        authUserId: "user-1",
      })
    );
    expect(getGameLeaderboard).toHaveBeenCalledWith({
      gameSlug: "wheel-of-fortune",
      playerId: "user-1",
      topLimit: 5,
      windowRadius: 2,
    });
  });
});
