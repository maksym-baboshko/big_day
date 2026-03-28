import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const managedBaseURL = "http://localhost:3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? managedBaseURL;
const webServerURL = new URL("/favicon.svg", managedBaseURL).toString();
const projectRoot = process.cwd();
const playwrightArtifactsDirectory = resolve(projectRoot, "artifacts/playwright");

export default defineConfig({
  outputDir: resolve(playwrightArtifactsDirectory, "test-results"),
  expect: {
    toHaveScreenshot: {
      pathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{-projectName}{ext}",
      threshold: 0.3,
      maxDiffPixelRatio: 0.002,
    },
  },
  reporter: isCI
    ? [
        ["github"],
        ["html", { open: "never", outputFolder: resolve(playwrightArtifactsDirectory, "report") }],
      ]
    : [
        ["list"],
        ["html", { open: "never", outputFolder: resolve(playwrightArtifactsDirectory, "report") }],
      ],
  testDir: resolve(projectRoot, "e2e"),
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
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
        command: "pnpm build && pnpm exec next start --hostname localhost --port 3100",
        cwd: projectRoot,
        url: webServerURL,
        reuseExistingServer: !isCI,
        timeout: isCI ? 120_000 : 180_000,
      }
    : undefined,
});
