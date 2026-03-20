/** @vitest-environment node */

import {
  createApiErrorPayload,
  createApiErrorResponse,
  createInvalidDataErrorResponse,
} from "./api-error-response";

describe("api error response helpers", () => {
  it("creates stable error payloads", () => {
    expect(
      createApiErrorPayload({
        error: "Invalid payload.",
        code: "INVALID_DATA",
        requestId: "request-1",
      })
    ).toEqual({
      error: "Invalid payload.",
      code: "INVALID_DATA",
      requestId: "request-1",
    });
  });

  it("adds retry headers when needed", async () => {
    const response = createApiErrorResponse({
      status: 429,
      error: "Too many requests.",
      code: "RATE_LIMITED",
      requestId: "request-2",
      retryAfterSeconds: 42,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests.",
      code: "RATE_LIMITED",
      requestId: "request-2",
      retryAfterSeconds: 42,
    });
  });

  it("creates invalid data responses with the shared contract", async () => {
    const response = createInvalidDataErrorResponse(
      "Invalid test payload.",
      "request-3"
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid test payload.",
      code: "INVALID_DATA",
      requestId: "request-3",
    });
  });
});
