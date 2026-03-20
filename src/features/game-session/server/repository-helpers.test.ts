/** @vitest-environment node */

import {
  clampRemainingSeconds,
  computeServerRemainingSeconds,
  getAvatarKeyForPlayer,
  hasValidChoiceResponse,
} from "./repository-helpers";

describe("repository-helpers", () => {
  it("derives stable avatar keys from player ids", () => {
    expect(getAvatarKeyForPlayer("player-1")).toBe(getAvatarKeyForPlayer("player-1"));
    expect(typeof getAvatarKeyForPlayer("player-2")).toBe("string");
  });

  it("clamps remaining seconds to the timer bounds", () => {
    expect(clampRemainingSeconds(12.8, 10)).toBe(10);
    expect(clampRemainingSeconds(-3, 10)).toBe(0);
    expect(clampRemainingSeconds(4.4, 10)).toBe(4);
  });

  it("computes remaining seconds from the server-side timer anchor", () => {
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-03-20T12:00:05.000Z").getTime()
    );

    expect(
      computeServerRemainingSeconds(
        {
          timer_status: "running",
          timer_last_started_at: "2026-03-20T12:00:00.000Z",
          timer_remaining_seconds: 12,
          timer_duration_seconds: 15,
        },
        15
      )
    ).toBe(7);
  });

  it("validates localized choice responses against all variants", () => {
    const task = {
      metadata: {
        choiceOptions: [
          { uk: "Так", en: "Yes" },
          { uk: "Ні", en: "No" },
        ],
      },
    };

    expect(hasValidChoiceResponse(task, "Так")).toBe(true);
    expect(hasValidChoiceResponse(task, "Yes")).toBe(true);
    expect(hasValidChoiceResponse(task, "Maybe")).toBe(false);
  });
});
