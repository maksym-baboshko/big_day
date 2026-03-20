/** @vitest-environment node */

const {
  afterMock,
  enforceRateLimit,
  handleGameApiError,
  runDeferredTasks,
  requireAuthenticatedGameUser,
  resolveWheelRound,
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
  resolveWheelRound: vi.fn(),
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
    requireAuthenticatedGameUser,
    resolveWheelRound,
  };
});

import { POST } from "./route";

describe("POST /api/games/wheel/[roundId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedGameUser.mockResolvedValue({ id: "user-1" });
    resolveWheelRound.mockResolvedValue({
      player: { playerId: "player-1" },
      round: { roundId: "round-1" },
      deferredTasks: [{ label: "task", run: async () => {} }],
    });
  });

  it("rejects invalid resolution payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/wheel/round-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-wheel-resolve-invalid",
        },
        body: JSON.stringify({
          locale: "uk",
          resolution: "invalid",
        }),
      }),
      { params: Promise.resolve({ roundId: "round-1" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid wheel resolution payload.",
      code: "INVALID_DATA",
      requestId: "request-wheel-resolve-invalid",
    });
    expect(resolveWheelRound).not.toHaveBeenCalled();
  });

  it("resolves a round and runs deferred tasks", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/wheel/round-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-wheel-resolve",
        },
        body: JSON.stringify({
          locale: "en",
          resolution: "completed",
          responseText: "Done",
        }),
      }),
      { params: Promise.resolve({ roundId: "round-1" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      player: { playerId: "player-1" },
      round: { roundId: "round-1" },
    });
    expect(resolveWheelRound).toHaveBeenCalledWith({
      playerId: "user-1",
      roundId: "round-1",
      locale: "en",
      resolution: "completed",
      responseText: "Done",
    });
    expect(afterMock).toHaveBeenCalledTimes(1);
    expect(runDeferredTasks).toHaveBeenCalledTimes(1);
  });
});
