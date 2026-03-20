/** @vitest-environment node */

import { handleGameApiError } from "./game-api-error-handler";
import { RateLimitExceededError } from "./rate-limit";
import {
  InvalidWheelRoundResponseError,
  SupabaseConfigurationError,
  UnauthorizedGameRequestError,
  WheelRoundNotFoundError,
} from "@/features/game-session/server";

describe("handleGameApiError", () => {
  it("maps known domain errors to structured API responses", async () => {
    const response = handleGameApiError(
      new WheelRoundNotFoundError(),
      "Fallback",
      {
        requestId: "request-1",
        scope: "api.games.test",
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Wheel round was not found.",
      code: "ROUND_NOT_FOUND",
      requestId: "request-1",
    });
  });

  it("maps rate-limit errors with retry headers", async () => {
    const response = handleGameApiError(
      new RateLimitExceededError(30),
      "Fallback",
      {
        requestId: "request-2",
        scope: "api.games.test",
      }
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests.",
      code: "RATE_LIMITED",
      requestId: "request-2",
      retryAfterSeconds: 30,
    });
  });

  it("falls back to persistence errors for unknown exceptions", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = handleGameApiError(new Error("boom"), "Custom fallback", {
      requestId: "request-3",
      scope: "api.games.test",
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Custom fallback",
      code: "PERSISTENCE_ERROR",
      requestId: "request-3",
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        scope: "api.games.test",
        event: "unhandled_api_error",
        requestId: "request-3",
        context: {
          fallbackMessage: "Custom fallback",
        },
      })
    );
  });

  it("covers the remaining mapped error types", async () => {
    const unauthorizedResponse = handleGameApiError(
      new UnauthorizedGameRequestError(),
      "Fallback",
      {
        requestId: "request-4",
        scope: "api.games.test",
      }
    );
    const invalidResponse = handleGameApiError(
      new InvalidWheelRoundResponseError(),
      "Fallback",
      {
        requestId: "request-5",
        scope: "api.games.test",
      }
    );
    const configResponse = handleGameApiError(
      new SupabaseConfigurationError(),
      "Fallback",
      {
        requestId: "request-6",
        scope: "api.games.test",
      }
    );

    expect(unauthorizedResponse.status).toBe(401);
    expect(invalidResponse.status).toBe(400);
    expect(configResponse.status).toBe(503);
  });
});
