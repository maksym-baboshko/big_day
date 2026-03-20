import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./vitest/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportOnFailure: true,
      include: [
        "src/app/api/games/player/route.ts",
        "src/app/api/games/wheel/route.ts",
        "src/app/api/games/wheel/[roundId]/route.ts",
        "src/app/api/games/wheel/[roundId]/timer/route.ts",
        "src/app/api/games/wheel/[roundId]/timer/pause/route.ts",
        "src/app/api/live/route.ts",
        "src/app/api/rsvp/route.ts",
        "src/features/game-session/response-text.ts",
        "src/features/game-session/storage.ts",
        "src/features/wheel-of-fortune/wheel-game-reducer.ts",
        "src/shared/lib/server/deferred.ts",
        "src/shared/lib/server/game-api-error-handler.ts",
        "src/shared/lib/server/rate-limit.ts",
        "src/widgets/rsvp/model/schema.ts",
        "src/widgets/rsvp/rsvp-form-helpers.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 70,
      },
    },
  },
});
