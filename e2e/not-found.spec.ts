import { type Page, expect, test } from "@playwright/test";

const INVITE_SLUG = "papa-ihor";

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

test.describe("Not found page", () => {
  test("renders the branded 404 page for an unknown route", async ({ page }) => {
    await page.goto("/totally-missing-route");

    await expect(page.getByText("404").first()).toBeVisible();
    await expect(
      page
        .getByRole("heading", {
          name: /загубилася дорогою до свята|got lost on the way to the celebration/i,
        })
        .first(),
    ).toBeVisible();
  });

  test("language switcher changes locale on the branded 404 page", async ({ page }) => {
    await page.goto("/en/totally-missing-route");

    await expect(
      page.getByRole("heading", {
        name: /got lost on the way to the celebration/i,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: /switch language to ukrainian/i }).click();

    await expect(page).toHaveURL(/\/totally-missing-route$/);
    await expect(
      page.getByRole("heading", {
        name: /загубилася дорогою до свята/i,
      }),
    ).toBeVisible();
  });

  test("browser back restores the homepage content after an unknown route", async ({ page }) => {
    await page.goto("/");
    await expectHeroContentVisible(page);

    await page.goto("/totally-missing-route");
    await expect(page.getByText("404").first()).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(/(\/|\/en)$/);
    await expectHeroContentVisible(page);
    await expect(page.getByTestId("splash-overlay")).toHaveCount(0);
  });

  test("browser back restores the english homepage without replaying the splash overlay", async ({
    page,
  }) => {
    await page.goto("/en");
    await expectHeroContentVisible(page);

    await page.goto("/en/totally-missing-route");
    await expect(page.getByText("404").first()).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL("/en");
    await expectHeroContentVisible(page);
    await expect(page.getByTestId("splash-overlay")).toHaveCount(0);
  });

  test("go back returns to the previous page from the branded 404 screen", async ({ page }) => {
    await page.goto(`/invite/${INVITE_SLUG}`);
    await expect(page.getByText("Папа Ігор").first()).toBeVisible();

    await page.goto("/totally-missing-route");
    await expect(page.getByText("404").first()).toBeVisible();

    await page.getByRole("link", { name: /повернутись назад|go back/i }).click();

    await expect(page).toHaveURL(new RegExp(`(/en)?/invite/${INVITE_SLUG}$`));
    await expect(page.getByText("Папа Ігор").or(page.getByText("Papa Ihor")).first()).toBeVisible();
  });

  test("go back falls back to the homepage when the 404 page has no useful history entry", async ({
    page,
  }) => {
    await page.goto("/totally-missing-route");
    await expect(page.getByText("404").first()).toBeVisible();

    await page.getByRole("link", { name: /повернутись назад|go back/i }).click();

    await expect(page).toHaveURL(/(\/|\/en)$/);
    await expectHeroContentVisible(page);
  });

  test("secondary cta preserves the 404 page in browser history when returning home", async ({
    page,
  }) => {
    await page.goto("/totally-missing-route");
    await expect(page.getByText("404").first()).toBeVisible();

    await page.getByRole("link", { name: /повернутись назад|go back/i }).click();

    await expect(page).toHaveURL(/(\/|\/en)$/);
    await expectHeroContentVisible(page);

    await page.goBack();

    await expect(page).toHaveURL(/\/totally-missing-route$/);
    await expect(page.getByText("404").first()).toBeVisible();
  });

  test("invalid locale paths do not leave a dead-end history entry after go back", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Максим").or(page.getByText("Maksym")).first()).toBeVisible();

    await page.goto(`/invite/${INVITE_SLUG}`);
    await expect(page.getByText("Папа Ігор").or(page.getByText("Papa Ihor")).first()).toBeVisible();

    await page.goto("/test");
    await expect(page.getByText("404").first()).toBeVisible();

    await page.getByRole("link", { name: /повернутись назад|go back/i }).click();

    await expect(page).toHaveURL(new RegExp(`(/en)?/invite/${INVITE_SLUG}$`));
    await expect(page.getByText("Папа Ігор").or(page.getByText("Papa Ihor")).first()).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(/\/test$/);
    await expect(page.getByText("404").first()).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`(/en)?/invite/${INVITE_SLUG}$`));
    await expect(page.getByText("Папа Ігор").or(page.getByText("Papa Ihor")).first()).toBeVisible();
  });
});
