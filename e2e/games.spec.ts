import { expect, test } from "@playwright/test";
import {
  createUniqueNickname,
  openLivePage,
  registerPlayer,
  resolveWheelRound,
} from "./test-helpers";

test("creates a player session on the wheel page", async ({ page }) => {
  const nickname = createUniqueNickname("player");

  await registerPlayer(page, nickname);
  await expect(page.getByText("You are playing as")).toBeVisible();
});

test("starts and resolves a wheel round", async ({ page }) => {
  const nickname = createUniqueNickname("wheel");
  await registerPlayer(page, nickname);

  const resolution = await resolveWheelRound(page);

  await expect(page.getByText("Current challenge")).toBeVisible();
  await expect(page.getByText(resolution)).toBeVisible();
});

test("refreshes the live feed when a new player joins", async ({ page }) => {
  const nickname = createUniqueNickname("live");
  const livePage = await openLivePage(page);

  await registerPlayer(page, nickname);

  await expect(livePage.getByText(nickname)).toBeVisible({ timeout: 35_000 });
  await expect(livePage.getByText("A new player joined").first()).toBeVisible({
    timeout: 35_000,
  });

  await livePage.close();
});
