/** @vitest-environment node */

import {
  createServerLogPayload,
  logServerError,
  logServerInfo,
} from "./logger";

describe("server logger", () => {
  it("creates stable structured payloads", () => {
    const payload = createServerLogPayload("error", {
      scope: "api.test",
      event: "failed",
      requestId: "request-1",
      context: {
        route: "/api/test",
      },
      error: new Error("boom"),
    });

    expect(payload).toEqual(
      expect.objectContaining({
        level: "error",
        scope: "api.test",
        event: "failed",
        requestId: "request-1",
        context: {
          route: "/api/test",
        },
        error: expect.objectContaining({
          name: "Error",
          message: "boom",
        }),
      })
    );
    expect(payload.timestamp).toEqual(expect.any(String));
  });

  it("logs info and error payloads as structured objects", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logServerInfo({
      scope: "api.test",
      event: "started",
    });
    logServerError({
      scope: "api.test",
      event: "failed",
      error: new Error("boom"),
    });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        scope: "api.test",
        event: "started",
      })
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        scope: "api.test",
        event: "failed",
      })
    );
  });
});
