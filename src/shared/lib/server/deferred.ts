import "server-only";

import { logServerError } from "./logger";

export interface DeferredTask {
  label: string;
  run: () => Promise<void>;
}

export async function runDeferredTasks(tasks: DeferredTask[]): Promise<void> {
  const results = await Promise.allSettled(tasks.map((task) => task.run()));

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      logServerError({
        scope: "deferred",
        event: "task_failed",
        context: {
          label: tasks[index]?.label ?? "unknown",
        },
        error: result.reason,
      });
    }
  }
}
