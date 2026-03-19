import "server-only";

export type DeferredTask = () => Promise<void>;

export async function runDeferredTasks(tasks: DeferredTask[]): Promise<void> {
  const results = await Promise.allSettled(tasks.map((task) => task()));

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Deferred task failed:", result.reason);
    }
  }
}
