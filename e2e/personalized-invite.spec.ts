import { expect, test } from "@playwright/test";

const RSVP_STORAGE_KEY = "diandmax:rsvp-submissions";
const INVITE_SLUG = "papa-ihor";

test.describe("Personalized invite", () => {
  test("renders personalized guest content and marks the page noindex", async ({ page }) => {
    await page.goto(`/invite/${INVITE_SLUG}`);

    await expect(page.getByText("Папа Ігор").first()).toBeVisible();
    await expect(page.getByText("4 місця")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("submits RSVP through the mock service and stores it locally", async ({ page }) => {
    await page.goto(`/invite/${INVITE_SLUG}`);
    await page.evaluate((storageKey) => {
      window.localStorage.removeItem(storageKey);
    }, RSVP_STORAGE_KEY);

    await page.evaluate(() => {
      document.getElementById("rsvp")?.scrollIntoView();
    });

    await expect(page.getByRole("heading", { name: "RSVP" })).toBeVisible();
    await page.getByRole("button", { name: /Так/i }).click();
    await expect(page.getByLabel("Гість 1")).toHaveValue("Ігор Бабошко");
    await page.getByLabel("Гість 2").fill("Ірина Бабошко");
    await page.getByLabel("Гість 3").fill("Марія Бабошко");
    await page.getByLabel("Гість 4").fill("Сергій Бабошко");
    await page.getByRole("button", { name: "Надіслати" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Дякуємо за відповідь, Ігор!")).toBeVisible();

    await page.getByRole("button", { name: /повернутись|return/i }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("#rsvp h2").first()).toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

    await expect
      .poll(async () =>
        page.evaluate((storageKey) => {
          const stored = window.localStorage.getItem(storageKey);
          return stored ? JSON.parse(stored) : [];
        }, RSVP_STORAGE_KEY),
      )
      .toEqual([
        {
          attending: "yes",
          dietary: "",
          guestNames: ["Ігор Бабошко", "Ірина Бабошко", "Марія Бабошко", "Сергій Бабошко"],
          guests: 4,
          message: "",
          slug: INVITE_SLUG,
          website: "",
        },
      ]);
  });

  test("/en/invite renders English personalized content", async ({ page }) => {
    await page.goto(`/en/invite/${INVITE_SLUG}`);

    await expect(page.getByText("Papa Ihor").first()).toBeVisible();
    await expect(page.getByText("4 seats")).toBeVisible();
  });

  test("invalid submit focuses the first invalid guest field and shows the validation error", async ({
    page,
  }) => {
    await page.goto(`/invite/${INVITE_SLUG}`);
    await page.evaluate(() => {
      document.getElementById("rsvp")?.scrollIntoView();
    });
    await page.getByRole("button", { name: /Так/i }).first().click();

    const primaryGuestField = page.getByLabel("Гість 1");
    await primaryGuestField.clear();
    await page.getByRole("button", { name: "Надіслати" }).click();

    await expect(primaryGuestField).toBeFocused();
    await expect(page.locator("#rsvp-guest-name-0-error")).toBeVisible();
  });
});

test.describe("Personalized invite — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders the invite and RSVP section on a narrow viewport", async ({ page }) => {
    await page.goto(`/invite/${INVITE_SLUG}`);
    await expect(page.getByText("Папа Ігор").first()).toBeVisible();

    await page.evaluate(() => {
      document.getElementById("rsvp")?.scrollIntoView();
    });

    await expect(page.getByRole("heading", { name: "RSVP" })).toBeVisible();
  });
});
