import type { LocalizedGameText } from "./games";
import categoriesData from "./wheel-categories.json";
import tasksData from "./wheel-tasks.json";

export type WheelInteractionType =
  | "confirm"
  | "text_input"
  | "timer"
  | "async_task";

export type WheelResponseMode = "confirm" | "text_input";

export type WheelExecutionMode = "instant" | "timed" | "deferred";

export type WheelDifficulty = "gentle" | "warm" | "bold";

export interface WheelCategoryDefinition {
  slug: string;
  title: LocalizedGameText;
  description: LocalizedGameText;
}

export interface WheelTaskDefinition {
  taskKey: string;
  categorySlug: string;
  interactionType: WheelInteractionType;
  responseMode: WheelResponseMode;
  executionMode: WheelExecutionMode;
  allowPromise: boolean;
  allowEarlyCompletion: boolean;
  difficulty: WheelDifficulty;
  prompt: LocalizedGameText;
  details?: LocalizedGameText;
  timerSeconds?: number;
}

const difficultyBaseXp: Record<WheelDifficulty, number> = {
  gentle: 12,
  warm: 18,
  bold: 26,
};

const promiseXpByExecutionMode: Record<
  WheelExecutionMode,
  Record<WheelDifficulty, number>
> = {
  instant: {
    gentle: 0,
    warm: 0,
    bold: 0,
  },
  timed: {
    gentle: 0,
    warm: 0,
    bold: 0,
  },
  deferred: {
    gentle: 6,
    warm: 8,
    bold: 10,
  },
};

const skipPenaltyXpByDifficulty: Record<WheelDifficulty, number> = {
  gentle: -6,
  warm: -6,
  bold: -8,
};

export const WHEEL_CONTENT_CATEGORIES =
  categoriesData as readonly WheelCategoryDefinition[];

export const WHEEL_CONTENT_TASKS = tasksData as readonly WheelTaskDefinition[];

export function getWheelContentCategoryBySlug(slug: string) {
  return WHEEL_CONTENT_CATEGORIES.find((category) => category.slug === slug);
}

export function getWheelContentTaskByKey(taskKey: string) {
  return WHEEL_CONTENT_TASKS.find((task) => task.taskKey === taskKey);
}

export function getWheelContentTasksByCategory(categorySlug: string) {
  return WHEEL_CONTENT_TASKS.filter((task) => task.categorySlug === categorySlug);
}

export function getWheelTaskXpConfig(task: Pick<
  WheelTaskDefinition,
  "difficulty" | "executionMode" | "allowPromise"
>) {
  return {
    baseXp: difficultyBaseXp[task.difficulty],
    promiseXp: task.allowPromise
      ? promiseXpByExecutionMode[task.executionMode][task.difficulty]
      : 0,
    skipPenaltyXp: skipPenaltyXpByDifficulty[task.difficulty],
  };
}

export function getWheelContentSummary() {
  return WHEEL_CONTENT_CATEGORIES.map((category) => ({
    slug: category.slug,
    taskCount: getWheelContentTasksByCategory(category.slug).length,
  }));
}
