import { expect, test } from "@playwright/test";
import { RSVP_PAGE_PATH, createUniqueNickname } from "./test-helpers";

test("submits the RSVP form in mock mode", async ({ page }) => {
  await page.goto(RSVP_PAGE_PATH);

  await page.getByPlaceholder("John Doe").fill(createUniqueNickname("guest"));
  await page.getByRole("button", { name: /^Yes/i }).click();
  await page.getByRole("button", { name: "+" }).click();
  await page.getByPlaceholder("Guest full name").fill(createUniqueNickname("plus"));
  await page
    .getByPlaceholder("Do you have any special dietary needs?")
    .fill("Vegetarian");
  await page
    .getByPlaceholder("Your warm words for us...")
    .fill("Looking forward to celebrating with you.");

  await page.getByRole("button", { name: /Submit/i }).click();

  await expect(
    page.getByRole("heading", { name: /Thank you for your response/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Go back" })).toBeVisible();
});
