import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const storybookConfigDirectory = resolve(projectRoot, "configs/storybook");
const unitCoverageDirectory = resolve(projectRoot, "artifacts/vitest/coverage");
const testExclude = ["node_modules", ".cache", "artifacts", "e2e"];
const publicApiAliases = {
  "@/entities/event": resolve(projectRoot, "src/entities/event/index.ts"),
  "@/entities/guest": resolve(projectRoot, "src/entities/guest/index.ts"),
  "@/features/countdown": resolve(projectRoot, "src/features/countdown/index.ts"),
  "@/features/language-switcher": resolve(projectRoot, "src/features/language-switcher/index.ts"),
  "@/features/rsvp": resolve(projectRoot, "src/features/rsvp/index.ts"),
  "@/features/theme-switcher": resolve(projectRoot, "src/features/theme-switcher/index.ts"),
  "@/shared/config": resolve(projectRoot, "src/shared/config/index.ts"),
  "@/shared/lib": resolve(projectRoot, "src/testing/mocks/shared-lib.ts"),
  "@/shared/ui": resolve(projectRoot, "src/shared/ui/index.ts"),
  "@/widgets/activity-feed": resolve(projectRoot, "src/widgets/activity-feed/index.ts"),
  "@/widgets/dress-code": resolve(projectRoot, "src/widgets/dress-code/index.ts"),
  "@/widgets/footer": resolve(projectRoot, "src/widgets/footer/index.ts"),
  "@/widgets/gifts": resolve(projectRoot, "src/widgets/gifts/index.ts"),
  "@/widgets/hero": resolve(projectRoot, "src/widgets/hero/index.ts"),
  "@/widgets/invitation": resolve(projectRoot, "src/widgets/invitation/index.ts"),
  "@/widgets/location": resolve(projectRoot, "src/widgets/location/index.ts"),
  "@/widgets/navbar": resolve(projectRoot, "src/widgets/navbar/index.ts"),
  "@/widgets/our-story": resolve(projectRoot, "src/widgets/our-story/index.ts"),
  "@/widgets/personal-invitation": resolve(projectRoot, "src/widgets/personal-invitation/index.ts"),
  "@/widgets/splash": resolve(projectRoot, "src/widgets/splash/index.ts"),
  "@/widgets/timeline": resolve(projectRoot, "src/widgets/timeline/index.ts"),
};

export default defineConfig({
  cacheDir: resolve(projectRoot, ".cache/vitest/root"),
  root: projectRoot,
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
      ...publicApiAliases,
      "next/font/local": resolve(projectRoot, "src/testing/mocks/next-font.ts"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: unitCoverageDirectory,
      exclude: ["configs/**", "e2e/**", "src/**/*.stories.tsx", "src/testing/**"],
      thresholds: {
        statements: 75,
        branches: 68,
        functions: 65,
        lines: 78,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          dir: projectRoot,
          environment: "node",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: testExclude,
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: storybookConfigDirectory })],
        test: {
          name: "storybook",
          dir: projectRoot,
          setupFiles: [resolve(projectRoot, "configs/storybook/vitest.setup.ts")],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
