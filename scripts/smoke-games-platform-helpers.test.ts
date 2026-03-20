import {
  SmokeRequestError,
  SmokeStepError,
  assertOk,
  createSmokeRunState,
  formatSmokeError,
  runSmokeStep,
} from "./smoke-games-platform-helpers.mjs";

describe("smoke-games-platform helpers", () => {
  it("tracks completed steps and preserves the last successful step on failure", async () => {
    const state = createSmokeRunState();

    await runSmokeStep(state, "cleanup_before", async () => undefined);

    await expect(
      runSmokeStep(state, "bootstrap_player", async () => {
        throw new Error("Player bootstrap failed.");
      })
    ).rejects.toMatchObject<Partial<SmokeStepError>>({
      failingStep: "bootstrap_player",
      lastSuccessfulStep: "cleanup_before",
      stepsCompleted: ["cleanup_before"],
    });
  });

  it("builds request-aware smoke failures with payload snippets", () => {
    const response = new Response(null, {
      status: 429,
      statusText: "Too Many Requests",
    });

    expect(() =>
      assertOk(response, { error: "Slow down", requestId: "req-1" }, "Rate limit", {
        url: "http://localhost:3000/api/games/player",
      })
    ).toThrow(SmokeRequestError);

    const error = new SmokeStepError("Rate limit (429): Slow down", {
      cause: new SmokeRequestError("Rate limit (429): Slow down", {
        status: 429,
        payload: { error: "Slow down", requestId: "req-1" },
        url: "http://localhost:3000/api/games/player",
      }),
      failingStep: "bootstrap_player",
      stepsCompleted: ["cleanup_before"],
    });

    expect(
      formatSmokeError(error, {
        serverLogDump: "[smoke server] booted",
      })
    ).toContain("Smoke test failed at step `bootstrap_player`.");
    expect(
      formatSmokeError(error, {
        serverLogDump: "[smoke server] booted",
      })
    ).toContain("HTTP status: 429.");
    expect(
      formatSmokeError(error, {
        serverLogDump: "[smoke server] booted",
      })
    ).toContain("\"requestId\": \"req-1\"");
  });
});
