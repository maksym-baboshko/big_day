/** @vitest-environment node */

const { getSupabaseAdminClient, rpcMock, singleMock } = vi.hoisted(() => {
  const singleMock = vi.fn();
  const rpcMock = vi.fn(() => ({
    single: singleMock,
  }));

  return {
    getSupabaseAdminClient: vi.fn(() => ({
      rpc: rpcMock,
    })),
    rpcMock,
    singleMock,
  };
});

vi.mock("./supabase", () => ({
  getSupabaseAdminClient,
}));

import {
  enforceRateLimit,
  getRateLimitErrorPayload,
  getRequestIpAddress,
  RateLimitExceededError,
} from "./rate-limit";

describe("rate-limit helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    singleMock.mockResolvedValue({
      data: {
        allowed: true,
        current_count: 1,
        remaining: 9,
        retry_after_seconds: 0,
      },
      error: null,
    });
  });

  it("builds a stable rate-limit payload", () => {
    expect(getRateLimitErrorPayload(42, "request-1")).toEqual({
      error: "Too many requests.",
      code: "RATE_LIMITED",
      requestId: "request-1",
      retryAfterSeconds: 42,
    });
  });

  it("prefers forwarded headers when resolving the client ip", () => {
    expect(
      getRequestIpAddress(
        new Request("http://localhost/api/test", {
          headers: {
            "x-forwarded-for": "203.0.113.10, 10.0.0.1",
          },
        })
      )
    ).toBe("203.0.113.10");

    expect(
      getRequestIpAddress(
        new Request("http://localhost/api/test", {
          headers: {
            "x-real-ip": "198.51.100.7",
          },
        })
      )
    ).toBe("198.51.100.7");
  });

  it("stores the retry-after duration on the error instance", () => {
    const error = new RateLimitExceededError(15);

    expect(error.retryAfterSeconds).toBe(15);
    expect(error.message).toBe("Too many requests.");
  });

  it("falls back through the known ip headers", () => {
    expect(
      getRequestIpAddress(
        new Request("http://localhost/api/test", {
          headers: {
            "cf-connecting-ip": "192.0.2.20",
          },
        })
      )
    ).toBe("192.0.2.20");

    expect(getRequestIpAddress(new Request("http://localhost/api/test"))).toBe(
      "unknown"
    );
  });

  it("consumes rate limits with an authenticated user id when present", async () => {
    await expect(
      enforceRateLimit({
        request: new Request("http://localhost/api/test"),
        scope: "games.player.read",
        limit: 10,
        windowSeconds: 60,
        authUserId: "user-123",
      })
    ).resolves.toBeUndefined();

    expect(getSupabaseAdminClient).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("consume_rate_limit_window", {
      p_scope: "games.player.read",
      p_identifier: "user:user-123",
      p_limit: 10,
      p_window_seconds: 60,
      p_now: expect.any(String),
    });
  });

  it("uses the request ip when no authenticated user id exists", async () => {
    await enforceRateLimit({
      request: new Request("http://localhost/api/test", {
        headers: {
          "x-forwarded-for": "203.0.113.11",
        },
      }),
      scope: "rsvp.submit",
      limit: 6,
      windowSeconds: 900,
    });

    expect(rpcMock).toHaveBeenCalledWith("consume_rate_limit_window", {
      p_scope: "rsvp.submit",
      p_identifier: "ip:203.0.113.11",
      p_limit: 6,
      p_window_seconds: 900,
      p_now: expect.any(String),
    });
  });

  it("throws the rpc error, missing result error, and rate-limit exceeded error", async () => {
    singleMock.mockResolvedValueOnce({
      data: null,
      error: new Error("rpc failed"),
    });

    await expect(
      enforceRateLimit({
        request: new Request("http://localhost/api/test"),
        scope: "games.player.read",
        limit: 10,
        windowSeconds: 60,
      })
    ).rejects.toThrow("rpc failed");

    singleMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      enforceRateLimit({
        request: new Request("http://localhost/api/test"),
        scope: "games.player.read",
        limit: 10,
        windowSeconds: 60,
      })
    ).rejects.toThrow("Rate limit function did not return a result.");

    singleMock.mockResolvedValueOnce({
      data: {
        allowed: false,
        current_count: 10,
        remaining: 0,
        retry_after_seconds: 25,
      },
      error: null,
    });

    await expect(
      enforceRateLimit({
        request: new Request("http://localhost/api/test"),
        scope: "games.player.read",
        limit: 10,
        windowSeconds: 60,
      })
    ).rejects.toEqual(expect.objectContaining({ retryAfterSeconds: 25 }));
  });
});
