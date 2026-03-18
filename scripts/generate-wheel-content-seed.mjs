import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const categoriesPath = path.join(
  rootDir,
  "src/shared/config/wheel-categories.json"
);
const tasksPath = path.join(rootDir, "src/shared/config/wheel-tasks.json");
const outputPath = path.join(rootDir, "supabase/seed_wheel_content.sql");

const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));
const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));

const expectedInteractionMix = {
  confirm: 8,
  text_input: 6,
  timer: 4,
  async_task: 2,
};

const supportedResponseModes = new Set(["confirm", "text_input"]);
const supportedExecutionModes = new Set(["instant", "timed", "deferred"]);

const baseXpByDifficulty = {
  gentle: 12,
  warm: 18,
  bold: 26,
};

const promiseXpByExecutionMode = {
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

const skipPenaltyXpByDifficulty = {
  gentle: -6,
  warm: -6,
  bold: -8,
};

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function deriveInteractionType(task) {
  if (task.executionMode === "timed") {
    return "timer";
  }

  if (task.executionMode === "deferred") {
    return "async_task";
  }

  if (task.responseMode === "text_input") {
    return "text_input";
  }

  return "confirm";
}

function validateContent() {
  assert(Array.isArray(categories), "Categories payload must be an array.");
  assert(Array.isArray(tasks), "Tasks payload must be an array.");
  assert(categories.length === 10, `Expected 10 categories, got ${categories.length}.`);
  assert(tasks.length === 200, `Expected 200 tasks, got ${tasks.length}.`);

  const categorySlugs = new Set();
  for (const category of categories) {
    assert(category.slug, "Every category must have a slug.");
    assert(!categorySlugs.has(category.slug), `Duplicate category slug: ${category.slug}`);
    categorySlugs.add(category.slug);
  }

  const taskKeys = new Set();
  for (const task of tasks) {
    assert(task.taskKey, "Every task must have a taskKey.");
    assert(!taskKeys.has(task.taskKey), `Duplicate taskKey: ${task.taskKey}`);
    taskKeys.add(task.taskKey);
    assert(categorySlugs.has(task.categorySlug), `Unknown categorySlug: ${task.categorySlug}`);
    assert(
      Object.hasOwn(expectedInteractionMix, task.interactionType),
      `Unknown interactionType for ${task.taskKey}: ${task.interactionType}`
    );
    assert(
      Object.hasOwn(baseXpByDifficulty, task.difficulty),
      `Unknown difficulty for ${task.taskKey}: ${task.difficulty}`
    );
    assert(
      supportedResponseModes.has(task.responseMode),
      `Unknown responseMode for ${task.taskKey}: ${task.responseMode}`
    );
    assert(
      supportedExecutionModes.has(task.executionMode),
      `Unknown executionMode for ${task.taskKey}: ${task.executionMode}`
    );
    assert(
      typeof task.allowPromise === "boolean",
      `Task ${task.taskKey} must declare allowPromise explicitly.`
    );
    assert(
      typeof task.allowEarlyCompletion === "boolean",
      `Task ${task.taskKey} must declare allowEarlyCompletion explicitly.`
    );
    assert(
      task.interactionType === deriveInteractionType(task),
      `Task ${task.taskKey} has inconsistent interactionType.`
    );
    assert(
      task.allowPromise === (task.executionMode === "deferred"),
      `Task ${task.taskKey} has invalid allowPromise for executionMode ${task.executionMode}.`
    );
    assert(
      task.allowEarlyCompletion === (task.executionMode === "timed"),
      `Task ${task.taskKey} has invalid allowEarlyCompletion for executionMode ${task.executionMode}.`
    );

    if (task.executionMode === "timed") {
      assert(
        typeof task.timerSeconds === "number" && task.timerSeconds > 0,
        `Timer task ${task.taskKey} must include a positive timerSeconds value.`
      );
    } else {
      assert(
        typeof task.timerSeconds === "undefined",
        `Non-timed task ${task.taskKey} must not include timerSeconds.`
      );
    }
  }

  for (const category of categories) {
    const categoryTasks = tasks.filter(
      (task) => task.categorySlug === category.slug
    );
    assert(
      categoryTasks.length === 20,
      `Category ${category.slug} must have 20 tasks, got ${categoryTasks.length}.`
    );

    const mix = {
      confirm: 0,
      text_input: 0,
      timer: 0,
      async_task: 0,
    };

    for (const task of categoryTasks) {
      mix[task.interactionType] += 1;
    }

    for (const [interactionType, expectedCount] of Object.entries(
      expectedInteractionMix
    )) {
      assert(
        mix[interactionType] === expectedCount,
        `Category ${category.slug} must have ${expectedCount} ${interactionType} tasks, got ${mix[interactionType]}.`
      );
    }
  }
}

function getTaskXpConfig(task) {
  return {
    baseXp: baseXpByDifficulty[task.difficulty],
    promiseXp: task.allowPromise
      ? promiseXpByExecutionMode[task.executionMode][task.difficulty]
      : 0,
    skipPenaltyXp: skipPenaltyXpByDifficulty[task.difficulty],
  };
}

function buildCategorySeedSql() {
  const valueRows = categories.map((category, index) => `  (
    ${sqlString(category.slug)},
    ${index + 1},
    1,
    ${sqlJson(category.title)},
    ${sqlJson(category.description)},
    true
  )`);

  return `insert into public.wheel_categories (
  slug,
  sort_order,
  weight,
  title_i18n,
  description_i18n,
  is_active
)
values
${valueRows.join(",\n")}
on conflict (slug) do update
set
  sort_order = excluded.sort_order,
  weight = excluded.weight,
  title_i18n = excluded.title_i18n,
  description_i18n = excluded.description_i18n,
  is_active = excluded.is_active;
`;
}

function buildTaskSeedSql() {
  const valueRows = tasks.map((task) => {
    const xp = getTaskXpConfig(task);
    const details = task.details ?? { uk: "", en: "" };
    const timerSeconds =
      typeof task.timerSeconds === "number" ? String(task.timerSeconds) : "null";

    return `  (
    (select id from public.wheel_categories where slug = ${sqlString(task.categorySlug)}),
    ${sqlString(task.taskKey)},
    ${sqlString(task.interactionType)},
    ${sqlString(task.responseMode)},
    ${sqlString(task.executionMode)},
    ${task.allowPromise},
    ${task.allowEarlyCompletion},
    ${sqlString(task.difficulty)},
    ${sqlJson(task.prompt)},
    ${sqlJson(details)},
    ${xp.baseXp},
    ${xp.promiseXp},
    ${xp.skipPenaltyXp},
    ${timerSeconds},
    true,
      ${sqlJson({
        categorySlug: task.categorySlug,
        source: "wheel-content-seed",
        taskContractVersion: 2,
      })}
  )`;
  });

  return `insert into public.wheel_tasks (
  category_id,
  task_key,
  interaction_type,
  response_mode,
  execution_mode,
  allow_promise,
  allow_early_completion,
  difficulty,
  prompt_i18n,
  details_i18n,
  base_xp,
  promise_xp,
  skip_penalty_xp,
  timer_seconds,
  is_active,
  metadata
)
values
${valueRows.join(",\n")}
on conflict (task_key) do update
  set
  category_id = excluded.category_id,
  interaction_type = excluded.interaction_type,
  response_mode = excluded.response_mode,
  execution_mode = excluded.execution_mode,
  allow_promise = excluded.allow_promise,
  allow_early_completion = excluded.allow_early_completion,
  difficulty = excluded.difficulty,
  prompt_i18n = excluded.prompt_i18n,
  details_i18n = excluded.details_i18n,
  base_xp = excluded.base_xp,
  promise_xp = excluded.promise_xp,
  skip_penalty_xp = excluded.skip_penalty_xp,
  timer_seconds = excluded.timer_seconds,
  is_active = excluded.is_active,
  metadata = excluded.metadata;
`;
}

validateContent();

const sql = `-- Generated by scripts/generate-wheel-content-seed.mjs
-- Do not edit manually. Update the JSON sources instead.

${buildCategorySeedSql()}

${buildTaskSeedSql()}
`;

fs.writeFileSync(outputPath, sql);

console.log(`Generated ${outputPath}`);
console.log(`Categories: ${categories.length}`);
console.log(`Tasks: ${tasks.length}`);
