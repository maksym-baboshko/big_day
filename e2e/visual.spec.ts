import { expect, test } from "@playwright/test";

async function stabilizePage(page: import("@playwright/test").Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function gotoVisualPage(page: import("@playwright/test").Page, path: string): Promise<void> {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(path);
}

test.describe("Visual regression", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("homepage baseline", async ({ page }) => {
    await gotoVisualPage(page, "/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByText("Максим").or(page.getByText("Maksym")).first()).toBeVisible();
    await stabilizePage(page);
    await page.waitForTimeout(6000);
    const scrollHint = page.getByText("Гортайте вниз").locator("..");

    await expect(page).toHaveScreenshot("homepage.png", {
      mask: [page.getByTestId("countdown"), scrollHint],
    });
  });

  test("personalized invite baseline", async ({ page }) => {
    await gotoVisualPage(page, "/invite/papa-ihor");
    await expect(page.getByText("Папа Ігор").first()).toBeVisible();
    await stabilizePage(page);
    await page.waitForTimeout(6000);
    const scrollHint = page.getByText("Гортайте вниз").locator("..");

    await expect(page).toHaveScreenshot("personalized-invite.png", {
      mask: [page.getByTestId("countdown"), scrollHint],
    });
  });

  test("/live empty baseline", async ({ page }) => {
    await gotoVisualPage(page, "/live?state=empty");
    await expect(page.getByTestId("live-feed-state-empty")).toHaveAttribute("aria-hidden", "false");
    await stabilizePage(page);
    const liveClock = page.locator('[data-testid="live-projector-page"] header time');

    await expect(page).toHaveScreenshot("live-empty.png", {
      fullPage: true,
      mask: [liveClock],
    });
  });

  test("/live error baseline", async ({ page }) => {
    await gotoVisualPage(page, "/live?state=error");
    await expect(page.getByTestId("live-feed-state-error")).toHaveAttribute("aria-hidden", "false");
    await stabilizePage(page);
    const liveClock = page.locator('[data-testid="live-projector-page"] header time');

    await expect(page).toHaveScreenshot("live-error.png", {
      fullPage: true,
      mask: [liveClock],
    });
  });
});
