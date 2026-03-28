import { expect, test } from "@playwright/test";

const RSVP_STORAGE_KEY = "diandmax:rsvp-submissions";
const INVITE_SLUG = "papa-ihor";

async function openRsvpSection(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    document.getElementById("rsvp")?.scrollIntoView();
  });
}

async function submitFullAttendanceRsvp(page: import("@playwright/test").Page): Promise<void> {
  await openRsvpSection(page);

  await expect(page.getByRole("heading", { name: "RSVP" })).toBeVisible();
  await page.getByRole("button", { name: /Так/i }).click();
  await expect(page.getByLabel("Гість 1")).toHaveValue("Ігор Бабошко");
  await page.getByLabel("Гість 2").fill("Ірина Бабошко");
  await page.getByLabel("Гість 3").fill("Марія Бабошко");
  await page.getByLabel("Гість 4").fill("Сергій Бабошко");
  await page.getByRole("button", { name: "Надіслати" }).click();
}

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

    await submitFullAttendanceRsvp(page);

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

  test("recovers from corrupted RSVP storage and persists a valid submission", async ({ page }) => {
    await page.goto(`/invite/${INVITE_SLUG}`);
    await page.evaluate((storageKey) => {
      window.localStorage.setItem(storageKey, "{broken");
    }, RSVP_STORAGE_KEY);

    await submitFullAttendanceRsvp(page);

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Дякуємо за відповідь, Ігор!")).toBeVisible();

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

  test("explicit invite locale path wins over a conflicting locale cookie", async ({ browser }) => {
    const context = await browser.newContext({ locale: "ru-RU" });

    await context.addCookies([
      {
        name: "NEXT_LOCALE",
        value: "uk",
        url: "http://localhost:3100",
      },
    ]);

    const page = await context.newPage();

    await page.goto(`/en/invite/${INVITE_SLUG}`);

    await expect(page).toHaveURL(`/en/invite/${INVITE_SLUG}`);
    await expect(page.getByText("Papa Ihor").first()).toBeVisible();

    await context.close();
  });

  test("unprefixed invite deep link honors the english locale cookie", async ({ browser }) => {
    const context = await browser.newContext({ locale: "ru-RU" });

    await context.addCookies([
      {
        name: "NEXT_LOCALE",
        value: "en",
        url: "http://localhost:3100",
      },
    ]);

    const page = await context.newPage();

    await page.goto(`/invite/${INVITE_SLUG}`);

    await expect(page).toHaveURL(`/en/invite/${INVITE_SLUG}`);
    await expect(page.getByText("Papa Ihor").first()).toBeVisible();

    await context.close();
  });

  test("invalid submit focuses the first invalid guest field and shows the validation error", async ({
    page,
  }) => {
    await page.goto(`/invite/${INVITE_SLUG}`);
    await openRsvpSection(page);
    await page.getByRole("button", { name: /Так/i }).first().click();

    const primaryGuestField = page.getByLabel("Гість 1");
    await primaryGuestField.clear();
    await page.getByRole("button", { name: "Надіслати" }).click();

    await expect(primaryGuestField).toBeFocused();
    await expect(page.locator("#rsvp-guest-name-0-error")).toBeVisible();
  });

  test("shows a graceful submit error when RSVP storage is unavailable", async ({ browser }) => {
    const context = await browser.newContext();

    await context.addInitScript((storageKey) => {
      const originalGetItem = Storage.prototype.getItem;
      const originalSetItem = Storage.prototype.setItem;

      Storage.prototype.getItem = function getItem(key: string): string | null {
        if (key === storageKey) {
          throw new Error("storage blocked");
        }

        return originalGetItem.call(this, key);
      };

      Storage.prototype.setItem = function setItem(key: string, value: string): void {
        if (key === storageKey) {
          throw new Error("storage blocked");
        }

        originalSetItem.call(this, key, value);
      };
    }, RSVP_STORAGE_KEY);

    const page = await context.newPage();

    await page.goto(`/invite/${INVITE_SLUG}`);
    await submitFullAttendanceRsvp(page);

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Щось пішло не так. Будь ласка, спробуйте пізніше.")).toBeVisible();

    await context.close();
  });

  test("unknown invite slug resolves to the branded noindex 404 page", async ({ page }) => {
    await page.goto("/invite/missing-guest");

    await expect(page.getByText("404").first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/i,
    );
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
