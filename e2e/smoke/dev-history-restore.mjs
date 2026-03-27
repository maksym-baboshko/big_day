import assert from "node:assert/strict";

import { chromium } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function getHeroOpacity(page) {
  return page
    .locator("#hero h1")
    .first()
    .evaluate((node) => {
      const wrapper = node.parentElement;

      if (!wrapper) {
        return 0;
      }

      return Number.parseFloat(window.getComputedStyle(wrapper).opacity);
    });
}

async function expectHeroVisible(page, label) {
  const opacity = await getHeroOpacity(page);

  assert.ok(opacity > 0.99, `${label}: expected hero opacity > 0.99, got ${opacity}`);
}

async function expectBrandedNotFound(page, path) {
  await assert.doesNotReject(
    page.waitForURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)),
  );
  await assert.doesNotReject(page.getByText("404").first().waitFor({ state: "visible" }));
}

const browser = await chromium.launch({ headless: true });

async function withNewPage(runScenario) {
  const page = await browser.newPage();

  try {
    await runScenario(page);
  } finally {
    await page.close();
  }
}

try {
  await withNewPage(async (page) => {
    await page.goto(`${baseURL}/en`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.goto(`${baseURL}/en/live?state=empty`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack();
    await page.waitForTimeout(1200);
    await expectHeroVisible(page, "english live -> browser back");
  });

  await withNewPage(async (page) => {
    await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.goto(`${baseURL}/live?state=empty`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack();
    await page.waitForTimeout(1200);
    await expectHeroVisible(page, "ukrainian live -> browser back");
  });

  await withNewPage(async (page) => {
    await page.goto(`${baseURL}/en`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.goto(`${baseURL}/en/test`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /go back/i }).click();
    await page.waitForURL(`${baseURL}/en`);
    await page.waitForTimeout(1200);
    await expectHeroVisible(page, "english 404 secondary cta -> home");
    await page.goBack();
    await page.waitForTimeout(1200);
    await expectBrandedNotFound(page, "/en/test");
  });

  await withNewPage(async (page) => {
    await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.goto(`${baseURL}/test`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /повернутись назад/i }).click();
    await page.waitForURL(`${baseURL}/`);
    await page.waitForTimeout(1200);
    await expectHeroVisible(page, "ukrainian 404 secondary cta -> home");
    await page.goBack();
    await page.waitForTimeout(1200);
    await expectBrandedNotFound(page, "/test");
  });

  console.log(`history restore smoke passed for ${baseURL}`);
} finally {
  await browser.close();
}
