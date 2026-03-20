/** @vitest-environment node */

const {
  enforceRateLimit,
  getRsvpEmailConfig,
  sendRsvpNotification,
} = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
  getRsvpEmailConfig: vi.fn(),
  sendRsvpNotification: vi.fn(),
}));

vi.mock("@/shared/lib/server", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib/server")>(
      "@/shared/lib/server"
    );

  return {
    ...actual,
    enforceRateLimit,
  };
});

vi.mock("@/widgets/rsvp/server", () => ({
  getRsvpEmailConfig,
  sendRsvpNotification,
}));

import { POST } from "./route";
import { RateLimitExceededError } from "@/shared/lib/server";

const validPayload = {
  guestNames: ["Maksym"],
  attending: "no",
  guests: 1,
  dietary: "",
  message: "",
  website: "",
};

describe("POST /api/rsvp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRsvpEmailConfig.mockReturnValue({ mode: "mock" });
    sendRsvpNotification.mockResolvedValue("email-1");
  });

  it("rejects invalid RSVP payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-rsvp-invalid",
        },
        body: JSON.stringify({
          ...validPayload,
          guestNames: [],
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid RSVP payload.",
      code: "INVALID_DATA",
      requestId: "request-rsvp-invalid",
    });
    expect(sendRsvpNotification).not.toHaveBeenCalled();
  });

  it("short-circuits honeypot submissions without sending email", async () => {
    const response = await POST(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...validPayload,
          website: "https://spam.example",
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(sendRsvpNotification).not.toHaveBeenCalled();
  });

  it("returns 503 when email delivery is not configured", async () => {
    getRsvpEmailConfig.mockReturnValue(null);

    const response = await POST(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-rsvp-config",
        },
        body: JSON.stringify(validPayload),
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "RSVP is not configured",
      code: "RSVP_NOT_CONFIGURED",
      requestId: "request-rsvp-config",
    });
  });

  it("maps rate-limit failures to 429 responses", async () => {
    enforceRateLimit.mockRejectedValueOnce(new RateLimitExceededError(60));

    const response = await POST(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "request-rsvp-rate-limit",
        },
        body: JSON.stringify(validPayload),
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests.",
      code: "RATE_LIMITED",
      requestId: "request-rsvp-rate-limit",
      retryAfterSeconds: 60,
    });
  });
});
