/** @vitest-environment node */

const { getLivePageSnapshot, SupabaseConfigurationError } = vi.hoisted(() => ({
  getLivePageSnapshot: vi.fn(),
  SupabaseConfigurationError: class SupabaseConfigurationError extends Error {
    constructor() {
      super("Supabase is not configured.");
      this.name = "SupabaseConfigurationError";
    }
  },
}));

vi.mock("@/features/game-session/server", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/game-session/server")>(
      "@/features/game-session/server"
    );

  return {
    ...actual,
    getLivePageSnapshot,
    SupabaseConfigurationError,
  };
});

import { GET } from "./route";

describe("GET /api/live", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLivePageSnapshot.mockResolvedValue({
      leaderboard: [],
      feed: [],
    });
  });

  it("rejects invalid query params", async () => {
    const response = await GET(
      new Request("http://localhost/api/live?leaderboardLimit=0", {
        headers: {
          "x-request-id": "request-live-invalid",
        },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid live snapshot query.",
      code: "INVALID_DATA",
      requestId: "request-live-invalid",
    });
    expect(getLivePageSnapshot).not.toHaveBeenCalled();
  });

  it("returns no-store snapshots on success", async () => {
    const response = await GET(
      new Request("http://localhost/api/live?leaderboardLimit=3&feedLimit=4")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      leaderboard: [],
      feed: [],
    });
    expect(getLivePageSnapshot).toHaveBeenCalledWith({
      leaderboardLimit: 3,
      feedLimit: 4,
    });
  });

  it("maps missing Supabase config to 503", async () => {
    getLivePageSnapshot.mockRejectedValue(new SupabaseConfigurationError());

    const response = await GET(
      new Request("http://localhost/api/live", {
        headers: {
          "x-request-id": "request-live-config",
        },
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Supabase is not configured.",
      code: "SUPABASE_NOT_CONFIGURED",
      requestId: "request-live-config",
    });
  });
});
