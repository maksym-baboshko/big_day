import { expect, type Page } from "@playwright/test";

export const RSVP_PAGE_PATH = "/en";
export const WHEEL_PAGE_PATH = "/en/games/wheel-of-fortune";
export const LIVE_PAGE_PATH = "/en/live";

export function createUniqueNickname(prefix = "e2e"): string {
  const suffix = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return `test-e2e-${prefix}-${suffix}`.slice(0, 40);
}

export async function registerPlayer(
  page: Page,
  nickname: string
): Promise<void> {
  await page.goto(WHEEL_PAGE_PATH);

  const nicknameField = page.getByLabel("Name or nickname");
  await expect(nicknameField).toBeVisible();
  await nicknameField.fill(nickname);

  await page.getByRole("button", { name: "Start playing" }).click();

  await expect(page.getByRole("heading", { name: nickname })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit name" })).toBeVisible();
}

export async function resolveWheelRound(
  page: Page
): Promise<"Completed" | "Promised"> {
  const spinButton = page.getByRole("button", { name: "Spin" });
  await expect(spinButton).toBeVisible();
  await expect(spinButton).toBeEnabled({ timeout: 15_000 });
  await spinButton.click({ force: true });

  const challengeDialog = page.getByTestId("wheel-challenge-overlay");
  await expect(challengeDialog).toBeVisible({
    timeout: 15_000,
  });

  const promiseButton = challengeDialog.getByRole("button", {
    name: "I promise",
  });
  const startTimedTaskButton = challengeDialog.getByRole("button", {
    name: "Start timed task",
  });
  const confirmChoiceButton = challengeDialog.getByRole("button", {
    name: "Confirm choice",
  });
  const choiceButtons = challengeDialog.locator("button[aria-pressed]");
  const responseField = challengeDialog.locator("#wheel-response");
  const completedButton = challengeDialog.getByRole("button", {
    name: "Completed",
  });

  await Promise.any([
    promiseButton.waitFor({ state: "visible", timeout: 5_000 }),
    startTimedTaskButton.waitFor({ state: "visible", timeout: 5_000 }),
    confirmChoiceButton.waitFor({ state: "visible", timeout: 5_000 }),
    responseField.waitFor({ state: "visible", timeout: 5_000 }),
    completedButton.waitFor({ state: "visible", timeout: 5_000 }),
  ]).catch(() => {
    throw new Error("Wheel challenge controls did not become visible.");
  });

  if (await promiseButton.isVisible()) {
    await promiseButton.click();
    await expect(page.getByText("Promised")).toBeVisible({
      timeout: 15_000,
    });
    return "Promised";
  }

  if (await startTimedTaskButton.isVisible()) {
    await startTimedTaskButton.click();
    await challengeDialog.getByRole("button", { name: "Finish early" }).click();
  } else {
    if (await confirmChoiceButton.isVisible()) {
      await expect(choiceButtons.first()).toBeVisible();
      await choiceButtons.first().click();
      await confirmChoiceButton.click();
    } else {
      if (await responseField.isVisible()) {
        await responseField.fill("End-to-end response");
      }

      await completedButton.click();
    }
  }

  await expect(page.getByText("Completed")).toBeVisible({ timeout: 15_000 });
  return "Completed";
}

export async function openLivePage(page: Page): Promise<Page> {
  const livePage = await page.context().newPage();
  await livePage.goto(LIVE_PAGE_PATH);
  await expect(livePage.getByText("Live feed")).toBeVisible();
  return livePage;
}
