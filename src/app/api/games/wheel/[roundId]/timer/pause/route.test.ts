/** @vitest-environment node */

const {
  enforceRateLimit,
  handleGameApiError,
  pauseWheelRoundTimer,
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
  pauseWheelRoundTimer: vi.fn(),
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
    pauseWheelRoundTimer,
    requireAuthenticatedGameUser,
  };
});

import { POST } from "./route";

describe("POST /api/games/wheel/[roundId]/timer/pause", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedGameUser.mockResolvedValue({ id: "user-1" });
    pauseWheelRoundTimer.mockResolvedValue({
      round: { roundId: "round-1" },
    });
  });

  it("rejects invalid pause payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/wheel/round-1/timer/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-wheel-timer-pause-invalid",
        },
        body: JSON.stringify({
          locale: "fr",
        }),
      }),
      { params: Promise.resolve({ roundId: "round-1" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid wheel timer pause payload.",
      code: "INVALID_DATA",
      requestId: "request-wheel-timer-pause-invalid",
    });
  });

  it("pauses the timer for valid requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/wheel/round-1/timer/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale: "en",
        }),
      }),
      { params: Promise.resolve({ roundId: "round-1" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      round: { roundId: "round-1" },
    });
    expect(pauseWheelRoundTimer).toHaveBeenCalledWith({
      playerId: "user-1",
      roundId: "round-1",
      locale: "en",
    });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "games.wheel.timer.pause",
      })
    );
  });
});
