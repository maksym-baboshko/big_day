import { defineConfig, devices } from "@playwright/test";

const PLAYWRIGHT_PORT = Number.parseInt(
  process.env.PLAYWRIGHT_PORT ?? "3200",
  10
);
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  `http://127.0.0.1:${PLAYWRIGHT_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.mjs",
  globalTeardown: "./e2e/global-teardown.mjs",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: `pnpm exec next start --hostname 127.0.0.1 --port ${PLAYWRIGHT_PORT}`,
    url: `${baseURL}/en/games`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      RSVP_DELIVERY_MODE: process.env.RSVP_DELIVERY_MODE ?? "mock",
    },
  },
});
