import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const managedBaseURL = "http://127.0.0.1:3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? managedBaseURL;
const webServerURL = new URL("/favicon.svg", managedBaseURL).toString();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "uk-UA",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: !process.env.PLAYWRIGHT_BASE_URL
    ? {
        command: "pnpm build && pnpm exec next start --hostname 127.0.0.1 --port 3100",
        url: webServerURL,
        reuseExistingServer: false,
        timeout: isCI ? 120_000 : 180_000,
      }
    : undefined,
});
