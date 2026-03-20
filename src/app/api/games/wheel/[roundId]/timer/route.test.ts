/** @vitest-environment node */

const {
  afterMock,
  enforceRateLimit,
  handleGameApiError,
  runDeferredTasks,
  requireAuthenticatedGameUser,
  startWheelRoundTimer,
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
  startWheelRoundTimer: vi.fn(),
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
    startWheelRoundTimer,
  };
});

import { POST } from "./route";

describe("POST /api/games/wheel/[roundId]/timer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedGameUser.mockResolvedValue({ id: "user-1" });
    startWheelRoundTimer.mockResolvedValue({
      round: { roundId: "round-1" },
      deferredTasks: [{ label: "task", run: async () => {} }],
    });
  });

  it("rejects invalid timer payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/wheel/round-1/timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-wheel-timer-invalid",
        },
        body: JSON.stringify({
          locale: "fr",
        }),
      }),
      { params: Promise.resolve({ roundId: "round-1" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid wheel timer payload.",
      code: "INVALID_DATA",
      requestId: "request-wheel-timer-invalid",
    });
    expect(startWheelRoundTimer).not.toHaveBeenCalled();
  });

  it("starts the timer and schedules deferred work", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/wheel/round-1/timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-wheel-timer",
        },
        body: JSON.stringify({
          locale: "uk",
        }),
      }),
      { params: Promise.resolve({ roundId: "round-1" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      round: { roundId: "round-1" },
    });
    expect(startWheelRoundTimer).toHaveBeenCalledWith({
      playerId: "user-1",
      roundId: "round-1",
      locale: "uk",
    });
    expect(runDeferredTasks).toHaveBeenCalledTimes(1);
  });
});
