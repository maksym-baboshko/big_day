/** @vitest-environment node */

const {
  enforceRateLimit,
  handleGameApiError,
  requireAuthenticatedGameUser,
  getOpenWheelRound,
  startWheelRound,
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
  requireAuthenticatedGameUser: vi.fn(),
  getOpenWheelRound: vi.fn(),
  startWheelRound: vi.fn(),
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
    getOpenWheelRound,
    requireAuthenticatedGameUser,
    startWheelRound,
  };
});

import { GET, POST } from "./route";

describe("wheel route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedGameUser.mockResolvedValue({ id: "user-1" });
    getOpenWheelRound.mockResolvedValue({ round: null });
    startWheelRound.mockResolvedValue({ round: { roundId: "round-1" } });
  });

  it("rejects invalid GET locales before auth and rate limiting", async () => {
    const response = await GET(
      new Request("http://localhost/api/games/wheel?locale=fr", {
        headers: {
          "x-request-id": "request-wheel-read-invalid",
        },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid wheel read payload.",
      code: "INVALID_DATA",
      requestId: "request-wheel-read-invalid",
    });
    expect(requireAuthenticatedGameUser).not.toHaveBeenCalled();
    expect(enforceRateLimit).not.toHaveBeenCalled();
  });

  it("returns the open round snapshot for valid GET requests", async () => {
    getOpenWheelRound.mockResolvedValue({ round: { roundId: "round-open" } });

    const response = await GET(
      new Request("http://localhost/api/games/wheel?locale=uk")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      round: { roundId: "round-open" },
    });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "games.wheel.read",
        authUserId: "user-1",
      })
    );
  });

  it("starts a wheel round for valid POST requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/games/wheel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-wheel-start",
        },
        body: JSON.stringify({ locale: "en" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      round: { roundId: "round-1" },
    });
    expect(startWheelRound).toHaveBeenCalledWith({
      playerId: "user-1",
      locale: "en",
    });
  });
});
