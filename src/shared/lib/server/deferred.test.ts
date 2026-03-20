/** @vitest-environment node */

import { runDeferredTasks } from "./deferred";

describe("runDeferredTasks", () => {
  it("executes all tasks and logs failures without throwing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const firstTask = {
      label: "first_task",
      run: vi.fn().mockResolvedValue(undefined),
    };
    const secondTask = {
      label: "second_task",
      run: vi.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(runDeferredTasks([firstTask, secondTask])).resolves.toBeUndefined();

    expect(firstTask.run).toHaveBeenCalledTimes(1);
    expect(secondTask.run).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        scope: "deferred",
        event: "task_failed",
        context: {
          label: "second_task",
        },
        error: expect.objectContaining({
          message: "boom",
          name: "Error",
        }),
      })
    );
  });
});
