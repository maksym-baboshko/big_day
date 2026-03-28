import { type Page, expect, test } from "@playwright/test";

async function expectHeroContentVisible(page: Page): Promise<void> {
  const heroHeading = page.locator("#hero h1").first();

  await expect(heroHeading).toBeVisible();
  await expect
    .poll(async () =>
      heroHeading.evaluate((node) => {
        const wrapper = node.parentElement;

        if (!wrapper) {
          return 0;
        }

        return Number.parseFloat(window.getComputedStyle(wrapper).opacity);
      }),
    )
    .toBeGreaterThan(0.99);
}

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders navbar with M & D logo", async ({ page }) => {
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: /m\s*&\s*d/i })).toBeVisible();
  });

  test("renders hero with couple names", async ({ page }) => {
    const hero = page.locator('[data-testid="hero"]').or(page.locator("main")).first();
    await expect(hero).toBeVisible();

    // Names appear on page
    await expect(page.getByText("Maksym").or(page.getByText("Максим")).first()).toBeVisible();
    await expect(page.getByText("Diana").or(page.getByText("Діана")).first()).toBeVisible();
  });

  test("countdown shows DD/HH/MM/SS labels", async ({ page }) => {
    // Wait for client-side hydration
    await page.waitForTimeout(1000);
    const countdown = page.getByTestId("countdown");
    await expect(countdown).toBeVisible();
    await expect(countdown).toContainText(/days|днів/i);
    await expect(countdown).toContainText(/hours|годин/i);
    await expect(countdown).toContainText(/mins|хвилин/i);
    await expect(countdown).toContainText(/secs|секунд/i);
  });

  test("language switcher is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /uk|en/i }).or(page.getByText(/uk|en/i)).first(),
    ).toBeVisible();
  });

  test("has RSVP section with form", async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById("rsvp")?.scrollIntoView();
    });
    await page.waitForTimeout(500);
    await expect(
      page
        .getByRole("heading", { name: /rsvp|підтверди/i })
        .or(page.locator("#rsvp"))
        .first(),
    ).toBeVisible();
  });

  test("browser back from live keeps the homepage hero visible", async ({ page }) => {
    await expectHeroContentVisible(page);

    await page.goto("/live?state=empty");
    await expect(page.getByTestId("live-projector-page")).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL("/");
    await expectHeroContentVisible(page);
  });
});

test.describe("Homepage — /en locale", () => {
  test("renders in English at /en", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Maksym").or(page.getByText("Diana")).first()).toBeVisible();
  });

  test("browser back from english live keeps the homepage hero visible", async ({ page }) => {
    await page.goto("/en");
    await expectHeroContentVisible(page);

    await page.goto("/en/live?state=empty");
    await expect(page.getByTestId("live-projector-page")).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL("/en");
    await expectHeroContentVisible(page);
  });

  test("clean storage defaults to English for a non-Slavic browser locale", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL("/en");
    await expect(page.getByText("Maksym").or(page.getByText("Diana")).first()).toBeVisible();
    await context.close();
  });

  test("clean storage still defaults to Ukrainian for a Russian browser locale", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "ru-RU" });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Максим").or(page.getByText("Діана")).first()).toBeVisible();

    await context.close();
  });
});

test.describe("Homepage — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows the mobile navigation trigger", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /відкрити меню|open menu/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /switch language|переключити мову/i }),
    ).toBeVisible();
  });
});
