import { expect, test } from "@playwright/test";

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
});

test.describe("Homepage — /en locale", () => {
  test("renders in English at /en", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Maksym").or(page.getByText("Diana")).first()).toBeVisible();
  });
});
