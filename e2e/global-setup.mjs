import { cleanupAutomatedTestRuntimeData } from "../scripts/cleanup-automated-test-data.mjs";

export default async function globalSetup() {
  await cleanupAutomatedTestRuntimeData({
    scopes: ["e2e", "legacy"],
  });
}
