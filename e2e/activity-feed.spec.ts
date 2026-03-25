import { type Page, expect, test } from "@playwright/test";

interface FeedEventSnapshotFixture {
  id: string;
  type: "player_joined" | "xp_awarded" | "answered" | "promised" | "new_top_player";
  playerId: string | null;
  avatarKey: string | null;
  playerName: string | null;
  gameSlug: string | null;
  promptI18n: Record<string, string> | null;
  answerI18n: Record<string, string> | null;
  xpDelta: number | null;
  createdAt: string;
}

interface LeaderboardEntrySnapshotFixture {
  rank: number;
  playerId: string;
  avatarKey: string | null;
  nickname: string;
  totalPoints: number;
}

interface ActivityFeedSnapshotFixture {
  feed: FeedEventSnapshotFixture[];
  leaderboard: LeaderboardEntrySnapshotFixture[];
  generatedAt: string;
}

const EMPTY_SNAPSHOT: ActivityFeedSnapshotFixture = {
  feed: [],
  leaderboard: [],
  generatedAt: "2026-06-28T17:00:00.000Z",
};

const POPULATED_SNAPSHOT: ActivityFeedSnapshotFixture = {
  feed: [
    {
      id: "event-1",
      type: "answered",
      playerId: "player-1",
      avatarKey: "olena-ry",
      playerName: "Олена",
      gameSlug: "wheel-of-fortune",
      promptI18n: {
        uk: "Коли ти зрозуміла, що це точно любов?",
        en: "When did you know this was definitely love?",
      },
      answerI18n: {
        uk: "Коли почала сміятися ще до того, як він договорив.",
        en: "When I started laughing before he even finished the sentence.",
      },
      xpDelta: 18,
      createdAt: "2026-06-28T17:45:00.000Z",
    },
    {
      id: "event-2",
      type: "player_joined",
      playerId: "player-2",
      avatarKey: "taras-ko",
      playerName: "Тарас",
      gameSlug: null,
      promptI18n: null,
      answerI18n: null,
      xpDelta: null,
      createdAt: "2026-06-28T17:40:00.000Z",
    },
  ],
  leaderboard: [
    {
      rank: 1,
      playerId: "player-1",
      avatarKey: "olena-ry",
      nickname: "Олена",
      totalPoints: 210,
    },
    {
      rank: 2,
      playerId: "player-2",
      avatarKey: "taras-ko",
      nickname: "Тарас",
      totalPoints: 184,
    },
  ],
  generatedAt: "2026-06-28T17:45:00.000Z",
};

async function mockActivityFeed(
  page: Page,
  resolveResponse: () =>
    | { status: number; body: ActivityFeedSnapshotFixture | { error: string } }
    | Promise<{ status: number; body: ActivityFeedSnapshotFixture | { error: string } }>,
) {
  await page.route("**/api/activity-feed**", async (route) => {
    const { status, body } = await resolveResponse();

    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test.describe("/live page", () => {
  test("renders the loading state and then the empty state", async ({ page }) => {
    await mockActivityFeed(page, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      return { status: 200, body: EMPTY_SNAPSHOT };
    });

    await page.goto("/live");

    await expect(page.locator('[data-testid="live-projector-page"]')).toBeVisible();
    await expect(page.getByTestId("live-feed-state-loading")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    await expect(page.getByTestId("live-feed-state-loading")).toContainText(
      "Завантажуємо стрічку...",
    );
    await expect(page.getByTestId("live-feed-state-empty")).toHaveAttribute("aria-hidden", "false");
    await expect(page.getByTestId("live-feed-state-empty")).toContainText("Поки тут тихо...");
    await expect(page.getByTestId("live-leaderboard-state-skeleton")).toBeVisible();
  });

  test("renders populated feed and leaderboard cards from the snapshot", async ({ page }) => {
    await mockActivityFeed(page, () => ({ status: 200, body: POPULATED_SNAPSHOT }));

    await page.goto("/live");

    const olenaFeedCard = page.locator(
      '[data-testid="feed-event-card"][data-event-id="event-1"]:visible',
    );
    const tarasFeedCard = page.locator(
      '[data-testid="feed-event-card"][data-event-id="event-2"]:visible',
    );
    const olenaLeaderboardRow = page
      .getByTestId("leaderboard-row")
      .filter({ hasText: "Олена" })
      .first();
    const tarasLeaderboardRow = page
      .getByTestId("leaderboard-row")
      .filter({ hasText: "Тарас" })
      .first();

    await expect(olenaFeedCard).toBeVisible();
    await expect(olenaFeedCard).toContainText("Wheel Of Fortune");
    await expect(olenaFeedCard).toContainText(
      "— Коли почала сміятися ще до того, як він договорив.",
    );
    await expect(tarasFeedCard).toBeVisible();
    await expect(olenaLeaderboardRow).toContainText("210");
    await expect(tarasLeaderboardRow).toContainText("184");
  });

  test("preserves the redesigned error state when the API is unavailable", async ({ page }) => {
    await mockActivityFeed(page, () => ({
      status: 503,
      body: { error: "Failed to load activity feed" },
    }));

    await page.goto("/live");

    await expect(page.getByTestId("live-feed-state-error")).toHaveAttribute("aria-hidden", "false");
    await expect(page.getByTestId("live-feed-state-error")).toContainText("Зв'язок перервано");
    await expect(page.getByTestId("live-feed-state-error")).toContainText(
      "Сервер тимчасово недоступний — спробуємо підключитися автоматично.",
    );
    await expect(page.getByTestId("live-leaderboard-state-error")).toBeVisible();
  });

  test("page is marked noindex", async ({ page }) => {
    await mockActivityFeed(page, () => ({ status: 200, body: EMPTY_SNAPSHOT }));

    await page.goto("/live");

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("/en/live renders the English empty state", async ({ page }) => {
    await mockActivityFeed(page, () => ({ status: 200, body: EMPTY_SNAPSHOT }));

    await page.goto("/en/live");

    await expect(page.locator('[data-testid="live-projector-page"]')).toBeVisible();
    await expect(page.getByTestId("live-feed-state-empty")).toHaveAttribute("aria-hidden", "false");
    await expect(page.getByTestId("live-feed-state-empty")).toContainText("Still quiet here...");
  });
});
