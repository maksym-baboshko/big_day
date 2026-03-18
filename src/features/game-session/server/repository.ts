import "server-only";

import type { SupportedLocale } from "@/shared/config";
import type {
  PlayerSessionSnapshot,
  WheelRoundResolution,
  WheelRoundSnapshot,
  WheelRoundTimerSnapshot,
} from "../types";
import type {
  GameRoundRow,
  JsonValue,
  LeaderboardViewRow,
  PlayerProfileRow,
  WheelCategoryRow,
  WheelPlayerTaskHistoryRow,
  WheelRoundAssignmentRow,
  WheelRoundPayload,
  WheelTaskRow,
} from "./types";
import { getSupabaseAdminClient } from "./supabase";

const WHEEL_GAME_SLUG = "wheel-of-fortune";

export class PlayerProfileNotReadyError extends Error {
  constructor() {
    super("The player profile is not ready yet.");
    this.name = "PlayerProfileNotReadyError";
  }
}

export class WheelTasksDepletedError extends Error {
  constructor() {
    super("No wheel tasks remain for this player.");
    this.name = "WheelTasksDepletedError";
  }
}

export class WheelRoundNotFoundError extends Error {
  constructor() {
    super("The wheel round was not found.");
    this.name = "WheelRoundNotFoundError";
  }
}

export class WheelRoundAlreadyResolvedError extends Error {
  constructor() {
    super("The wheel round is already resolved.");
    this.name = "WheelRoundAlreadyResolvedError";
  }
}

export class InvalidWheelRoundResponseError extends Error {
  constructor() {
    super("The wheel round response is invalid.");
    this.name = "InvalidWheelRoundResponseError";
  }
}

export class InvalidWheelRoundStateError extends Error {
  constructor() {
    super("The wheel round state is invalid.");
    this.name = "InvalidWheelRoundStateError";
  }
}

const PLAYER_AVATAR_KEYS = [
  "olive-branch",
  "golden-bell",
  "cedar-leaf",
  "quiet-dove",
  "linen-ribbon",
  "warm-candle",
  "harbor-light",
  "north-star",
] as const;

function hashString(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getAvatarKeyForPlayer(playerId: string) {
  return PLAYER_AVATAR_KEYS[hashString(playerId) % PLAYER_AVATAR_KEYS.length];
}

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalResponseText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  return normalized.length > 0 ? normalized : null;
}

function mapPlayerSnapshot(row: LeaderboardViewRow): PlayerSessionSnapshot {
  return {
    playerId: row.player_id,
    nickname: row.nickname ?? "",
    avatarKey: row.avatar_key,
    totalPoints: row.total_points,
  };
}

function readLocalizedText(
  value: unknown,
  locale: SupportedLocale,
  fallback: string
) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const localizedRecord = value as Record<string, unknown>;
    const exact = localizedRecord[locale];
    if (typeof exact === "string" && exact.trim().length > 0) {
      return exact;
    }

    const alternateLocale = locale === "uk" ? "en" : "uk";
    const alternate = localizedRecord[alternateLocale];
    if (typeof alternate === "string" && alternate.trim().length > 0) {
      return alternate;
    }
  }

  return fallback;
}

function buildWeightedCategoryPool(categories: readonly WheelCategoryRow[]) {
  return categories.flatMap((category) =>
    Array.from({ length: Math.max(category.weight, 1) }, () => category)
  );
}

function pickRandomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getCategorySpinAngle(
  categories: readonly WheelCategoryRow[],
  categoryId: string
) {
  const categoryIndex = categories.findIndex((category) => category.id === categoryId);
  const normalizedIndex = categoryIndex >= 0 ? categoryIndex : 0;
  const segmentAngle = 360 / Math.max(categories.length, 1);

  return Math.round(normalizedIndex * segmentAngle + segmentAngle / 2);
}

function getWheelRoundTimerSnapshot({
  round,
  task,
}: {
  round: Pick<GameRoundRow, "resolved_at" | "timer_started_at" | "timer_deadline_at">;
  task: Pick<WheelTaskRow, "execution_mode" | "timer_seconds">;
}): WheelRoundTimerSnapshot | null {
  if (task.execution_mode !== "timed") {
    return null;
  }

  if (!round.timer_started_at || !round.timer_deadline_at) {
    return {
      status: "idle",
      startedAt: null,
      deadlineAt: null,
      remainingSeconds: task.timer_seconds,
    };
  }

  const remainingSeconds = Math.max(
    0,
    Math.ceil((new Date(round.timer_deadline_at).getTime() - Date.now()) / 1000)
  );
  const isDone = Boolean(round.resolved_at) || remainingSeconds === 0;

  return {
    status: isDone ? "done" : "running",
    startedAt: round.timer_started_at,
    deadlineAt: round.timer_deadline_at,
    remainingSeconds: isDone ? 0 : remainingSeconds,
  };
}

function getWheelRoundPayload({
  round,
  category,
  task,
  locale,
  spinAngle,
}: {
  round: Pick<GameRoundRow, "timer_started_at" | "timer_deadline_at">;
  category: WheelCategoryRow;
  task: WheelTaskRow;
  locale: SupportedLocale;
  spinAngle: number;
}): WheelRoundPayload {
  return {
    categorySlug: category.slug,
    categoryTitle: readLocalizedText(category.title_i18n, locale, category.slug),
    taskKey: task.task_key,
    interactionType: task.interaction_type,
    responseMode: task.response_mode,
    executionMode: task.execution_mode,
    allowPromise: task.allow_promise,
    allowEarlyCompletion: task.allow_early_completion,
    difficulty: task.difficulty,
    prompt: readLocalizedText(task.prompt_i18n, locale, task.task_key),
    details: readLocalizedText(task.details_i18n, locale, ""),
    timerSeconds: task.timer_seconds,
    completionXp: task.base_xp,
    promiseXp: task.promise_xp,
    skipPenaltyXp: task.skip_penalty_xp,
    locale,
    spinAngle,
    timerStartedAt: round.timer_started_at,
    timerDeadlineAt: round.timer_deadline_at,
  };
}

function mapWheelRoundSnapshot({
  round,
  category,
  task,
  locale,
  spinAngle,
}: {
  round: Pick<
    GameRoundRow,
    "id" | "resolved_at" | "timer_started_at" | "timer_deadline_at"
  >;
  category: WheelCategoryRow;
  task: WheelTaskRow;
  locale: SupportedLocale;
  spinAngle: number;
}): WheelRoundSnapshot {
  return {
    roundId: round.id,
    spinAngle,
    category: {
      slug: category.slug,
      title: readLocalizedText(category.title_i18n, locale, category.slug),
      description: readLocalizedText(
        category.description_i18n,
        locale,
        category.slug
      ),
    },
    task: {
      taskKey: task.task_key,
      interactionType: task.interaction_type,
      responseMode: task.response_mode,
      executionMode: task.execution_mode,
      allowPromise: task.allow_promise,
      allowEarlyCompletion: task.allow_early_completion,
      difficulty: task.difficulty,
      prompt: readLocalizedText(task.prompt_i18n, locale, task.task_key),
      details: normalizeOptionalResponseText(
        readLocalizedText(task.details_i18n, locale, "")
      ),
      timerSeconds: task.timer_seconds,
      completionXp: task.base_xp,
      promiseXp: task.promise_xp,
      skipPenaltyXp: task.skip_penalty_xp,
    },
    timer: getWheelRoundTimerSnapshot({ round, task }),
  };
}

function getWheelXpDelta(task: WheelTaskRow, resolution: WheelRoundResolution) {
  switch (resolution) {
    case "completed":
      return task.base_xp;
    case "promised":
      return task.promise_xp;
    case "skipped":
      return task.skip_penalty_xp;
  }
}

function getWheelXpReason(resolution: WheelRoundResolution) {
  switch (resolution) {
    case "completed":
      return "wheel_round_completed";
    case "promised":
      return "wheel_round_promised";
    case "skipped":
      return "wheel_round_skipped";
  }
}

async function getPlayerSnapshotByPlayerId(playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leaderboard_view")
    .select(
      "player_id, nickname, avatar_key, total_points, last_scored_at, onboarding_completed, created_at, updated_at, last_seen_at"
    )
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPlayerSnapshot(data as LeaderboardViewRow) : null;
}

async function getPlayerProfileById(playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("player_profiles")
    .select(
      "id, display_name, display_name_normalized, avatar_key, locale, onboarding_completed, created_at, updated_at, last_seen_at"
    )
    .eq("id", playerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PlayerProfileRow | null) ?? null;
}

async function getActiveWheelCategories() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_categories")
    .select(
      "id, slug, sort_order, weight, title_i18n, description_i18n, is_active, created_at, updated_at"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelCategoryRow[];
}

async function getActiveWheelTasks() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_tasks")
    .select(
      "id, category_id, task_key, interaction_type, response_mode, execution_mode, allow_promise, allow_early_completion, difficulty, prompt_i18n, details_i18n, base_xp, promise_xp, skip_penalty_xp, timer_seconds, is_active, metadata, created_at, updated_at"
    )
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelTaskRow[];
}

async function getWheelHistoryForPlayer(playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_player_task_history")
    .select("player_id, task_id, first_round_id, created_at")
    .eq("player_id", playerId);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelPlayerTaskHistoryRow[];
}

async function getWheelTaskById(taskId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_tasks")
    .select(
      "id, category_id, task_key, interaction_type, response_mode, execution_mode, allow_promise, allow_early_completion, difficulty, prompt_i18n, details_i18n, base_xp, promise_xp, skip_penalty_xp, timer_seconds, is_active, metadata, created_at, updated_at"
    )
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WheelTaskRow | null) ?? null;
}

async function getWheelCategoryById(categoryId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_categories")
    .select(
      "id, slug, sort_order, weight, title_i18n, description_i18n, is_active, created_at, updated_at"
    )
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WheelCategoryRow | null) ?? null;
}

async function getWheelRoundById(roundId: string, playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_rounds")
    .select(
      "id, player_id, game_slug, status, started_at, timer_started_at, timer_deadline_at, resolved_at, resolution, response_payload, metadata"
    )
    .eq("id", roundId)
    .eq("player_id", playerId)
    .eq("game_slug", WHEEL_GAME_SLUG)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GameRoundRow | null) ?? null;
}

async function getWheelRoundAssignment(roundId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_round_assignments")
    .select("round_id, category_id, task_id, spin_angle, created_at")
    .eq("round_id", roundId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WheelRoundAssignmentRow | null) ?? null;
}

async function getWheelRoundContext(roundId: string, playerId: string) {
  const [round, assignment] = await Promise.all([
    getWheelRoundById(roundId, playerId),
    getWheelRoundAssignment(roundId),
  ]);

  if (!round || !assignment) {
    throw new WheelRoundNotFoundError();
  }

  const [category, task] = await Promise.all([
    getWheelCategoryById(assignment.category_id),
    getWheelTaskById(assignment.task_id),
  ]);

  if (!category || !task) {
    throw new WheelRoundNotFoundError();
  }

  return {
    round,
    assignment,
    category,
    task,
  };
}

async function deleteWheelRound(roundId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("game_rounds").delete().eq("id", roundId);

  if (error) {
    console.error("Failed to delete wheel round during cleanup:", error);
  }
}

async function logActivityEvent(event: {
  playerId: string;
  roundId: string;
  eventType: string;
  visibility: "private" | "feed";
  payload: JsonValue;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("activity_events").insert({
    player_id: event.playerId,
    game_slug: WHEEL_GAME_SLUG,
    round_id: event.roundId,
    event_type: event.eventType,
    visibility: event.visibility,
    payload: event.payload,
  });

  if (error) {
    console.error("Activity event insert failed:", error);
  }
}

export async function bootstrapPlayerProfile({
  authUserId,
  locale,
}: {
  authUserId: string;
  locale: SupportedLocale;
}) {
  const supabase = getSupabaseAdminClient();
  const existingProfile = await getPlayerProfileById(authUserId);
  const avatarKey = existingProfile?.avatar_key ?? getAvatarKeyForPlayer(authUserId);

  if (!existingProfile) {
    const { error } = await supabase.from("player_profiles").insert({
      id: authUserId,
      avatar_key: avatarKey,
      locale,
      onboarding_completed: false,
    });

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("player_profiles")
      .update({
        locale,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", authUserId);

    if (error) {
      throw error;
    }
  }

  const profile = await getPlayerProfileById(authUserId);

  if (!profile) {
    throw new Error("Failed to read player profile after bootstrap.");
  }

  if (!profile.onboarding_completed || !profile.display_name) {
    return null;
  }

  const playerSnapshot = await getPlayerSnapshotByPlayerId(authUserId);
  if (!playerSnapshot) {
    throw new Error("Failed to read player snapshot after bootstrap.");
  }

  return playerSnapshot;
}

export async function savePlayerProfile({
  authUserId,
  nickname,
  locale,
}: {
  authUserId: string;
  nickname: string;
  locale: SupportedLocale;
}) {
  const supabase = getSupabaseAdminClient();
  const normalizedNickname = normalizeDisplayName(nickname);

  const { error } = await supabase.from("player_profiles").upsert(
    {
      id: authUserId,
      display_name: normalizedNickname,
      display_name_normalized: normalizedNickname.toLocaleLowerCase(),
      avatar_key: getAvatarKeyForPlayer(authUserId),
      locale,
      onboarding_completed: true,
      last_seen_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    throw error;
  }

  const playerSnapshot = await getPlayerSnapshotByPlayerId(authUserId);
  if (!playerSnapshot) {
    throw new Error("Failed to read player snapshot after save.");
  }

  return playerSnapshot;
}

export async function startWheelRound({
  playerId,
  locale,
}: {
  playerId: string;
  locale: SupportedLocale;
}) {
  const supabase = getSupabaseAdminClient();
  const profile = await getPlayerProfileById(playerId);

  if (!profile?.onboarding_completed || !profile.display_name) {
    throw new PlayerProfileNotReadyError();
  }

  const [categories, tasks, taskHistory] = await Promise.all([
    getActiveWheelCategories(),
    getActiveWheelTasks(),
    getWheelHistoryForPlayer(playerId),
  ]);

  if (categories.length === 0 || tasks.length === 0) {
    throw new WheelTasksDepletedError();
  }

  const usedTaskIds = new Set(taskHistory.map((entry) => entry.task_id));
  const blockedTaskIds = new Set<string>();

  for (let attempt = 0; attempt < tasks.length; attempt += 1) {
    const availableGroups = categories
      .map((category) => ({
        category,
        tasks: tasks.filter(
          (task) =>
            task.category_id === category.id &&
            !usedTaskIds.has(task.id) &&
            !blockedTaskIds.has(task.id)
        ),
      }))
      .filter((group) => group.tasks.length > 0);

    if (availableGroups.length === 0) {
      break;
    }

    const weightedCategories = buildWeightedCategoryPool(
      availableGroups.map((group) => group.category)
    );
    const selectedCategory = pickRandomItem(weightedCategories);
    const selectedGroup = availableGroups.find(
      (group) => group.category.id === selectedCategory.id
    );

    if (!selectedGroup || selectedGroup.tasks.length === 0) {
      continue;
    }

    const selectedTask = pickRandomItem(selectedGroup.tasks);
    const spinAngle = getCategorySpinAngle(categories, selectedCategory.id);

    const { data: round, error: roundError } = await supabase
      .from("game_rounds")
      .insert({
        player_id: playerId,
        game_slug: WHEEL_GAME_SLUG,
        status: "assigned",
        metadata: {
          source: "wheel-round",
          locale,
          categorySlug: selectedCategory.slug,
          taskKey: selectedTask.task_key,
          interactionType: selectedTask.interaction_type,
          responseMode: selectedTask.response_mode,
          executionMode: selectedTask.execution_mode,
          allowPromise: selectedTask.allow_promise,
          allowEarlyCompletion: selectedTask.allow_early_completion,
          difficulty: selectedTask.difficulty,
          spinAngle,
          timerStartedAt: null,
          timerDeadlineAt: null,
        },
      })
      .select(
        "id, player_id, game_slug, status, started_at, timer_started_at, timer_deadline_at, resolved_at, resolution, response_payload, metadata"
      )
      .single();

    if (roundError) {
      throw roundError;
    }

    const roundRecord = round as GameRoundRow;
    const { error: historyError } = await supabase
      .from("wheel_player_task_history")
      .insert({
        player_id: playerId,
        task_id: selectedTask.id,
        first_round_id: roundRecord.id,
      });

    if (historyError) {
      await deleteWheelRound(roundRecord.id);

      if (historyError.code === "23505") {
        blockedTaskIds.add(selectedTask.id);
        continue;
      }

      throw historyError;
    }

    const { error: assignmentError } = await supabase
      .from("wheel_round_assignments")
      .insert({
        round_id: roundRecord.id,
        category_id: selectedCategory.id,
        task_id: selectedTask.id,
        spin_angle: spinAngle,
      });

    if (assignmentError) {
      await deleteWheelRound(roundRecord.id);
      throw assignmentError;
    }

    const roundSnapshot = mapWheelRoundSnapshot({
      round: roundRecord,
      category: selectedCategory,
      task: selectedTask,
      locale,
      spinAngle,
    });

    const payload = getWheelRoundPayload({
      round: roundRecord,
      category: selectedCategory,
      task: selectedTask,
      locale,
      spinAngle,
    });

    void logActivityEvent({
      playerId,
      roundId: roundRecord.id,
      eventType: "wheel.round.started",
      visibility: "private",
      payload,
    });

    return {
      round: roundSnapshot,
    };
  }

  throw new WheelTasksDepletedError();
}

export async function startWheelRoundTimer({
  playerId,
  roundId,
  locale,
}: {
  playerId: string;
  roundId: string;
  locale: SupportedLocale;
}) {
  const supabase = getSupabaseAdminClient();
  const profile = await getPlayerProfileById(playerId);

  if (!profile?.onboarding_completed || !profile.display_name) {
    throw new PlayerProfileNotReadyError();
  }

  const { round, assignment, category, task } = await getWheelRoundContext(
    roundId,
    playerId
  );

  if (round.resolved_at || round.resolution || round.status !== "assigned") {
    throw new WheelRoundAlreadyResolvedError();
  }

  if (task.execution_mode !== "timed" || !task.timer_seconds) {
    throw new InvalidWheelRoundStateError();
  }

  const spinAngle = assignment.spin_angle;

  if (round.timer_started_at && round.timer_deadline_at) {
    return {
      round: mapWheelRoundSnapshot({
        round,
        category,
        task,
        locale,
        spinAngle,
      }),
    };
  }

  const timerStartedAt = new Date().toISOString();
  const timerDeadlineAt = new Date(
    Date.now() + task.timer_seconds * 1000
  ).toISOString();
  const { data: updatedRound, error: updateError } = await supabase
    .from("game_rounds")
    .update({
      timer_started_at: timerStartedAt,
      timer_deadline_at: timerDeadlineAt,
      metadata: {
        ...(round.metadata && typeof round.metadata === "object"
          ? round.metadata
          : {}),
        timerStartedAt,
        timerDeadlineAt,
      },
    })
    .eq("id", roundId)
    .eq("player_id", playerId)
    .is("resolved_at", null)
    .is("timer_started_at", null)
    .select(
      "id, player_id, game_slug, status, started_at, timer_started_at, timer_deadline_at, resolved_at, resolution, response_payload, metadata"
    )
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRound) {
    const latestRound = await getWheelRoundById(roundId, playerId);

    if (!latestRound) {
      throw new WheelRoundNotFoundError();
    }

    if (
      latestRound.resolved_at ||
      latestRound.resolution ||
      latestRound.status !== "assigned"
    ) {
      throw new WheelRoundAlreadyResolvedError();
    }

    if (latestRound.timer_started_at && latestRound.timer_deadline_at) {
      return {
        round: mapWheelRoundSnapshot({
          round: latestRound,
          category,
          task,
          locale,
          spinAngle,
        }),
      };
    }

    throw new InvalidWheelRoundStateError();
  }

  const roundRecord = updatedRound as GameRoundRow;
  const payload = getWheelRoundPayload({
    round: roundRecord,
    category,
    task,
    locale,
    spinAngle,
  });
  const roundSnapshot = mapWheelRoundSnapshot({
    round: roundRecord,
    category,
    task,
    locale,
    spinAngle,
  });

  void logActivityEvent({
    playerId,
    roundId,
    eventType: "wheel.round.timer_started",
    visibility: "private",
    payload,
  });

  return {
    round: roundSnapshot,
  };
}

export async function resolveWheelRound({
  playerId,
  roundId,
  locale,
  resolution,
  responseText,
}: {
  playerId: string;
  roundId: string;
  locale: SupportedLocale;
  resolution: WheelRoundResolution;
  responseText?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const profile = await getPlayerProfileById(playerId);

  if (!profile?.onboarding_completed || !profile.display_name) {
    throw new PlayerProfileNotReadyError();
  }

  const { round, assignment, category, task } = await getWheelRoundContext(
    roundId,
    playerId
  );

  if (round.resolved_at || round.resolution || round.status !== "assigned") {
    throw new WheelRoundAlreadyResolvedError();
  }

  const normalizedResponseText = normalizeOptionalResponseText(responseText);
  if (
    resolution === "completed" &&
    task.response_mode === "text_input" &&
    !normalizedResponseText
  ) {
    throw new InvalidWheelRoundResponseError();
  }

  if (resolution === "promised" && !task.allow_promise) {
    throw new InvalidWheelRoundResponseError();
  }

  if (resolution === "completed" && task.execution_mode === "timed") {
    if (!round.timer_started_at || !round.timer_deadline_at) {
      throw new InvalidWheelRoundStateError();
    }

    const timerDeadlineMs = new Date(round.timer_deadline_at).getTime();
    const timerFinished = Date.now() >= timerDeadlineMs;

    if (!task.allow_early_completion && !timerFinished) {
      throw new InvalidWheelRoundStateError();
    }
  }

  const spinAngle = assignment.spin_angle;
  const xpDelta = getWheelXpDelta(task, resolution);
  const basePayload = getWheelRoundPayload({
    round,
    category,
    task,
    locale,
    spinAngle,
  });

  const { data: updatedRound, error: updateError } = await supabase
    .from("game_rounds")
    .update({
      status: "completed",
      resolved_at: new Date().toISOString(),
      resolution,
      response_payload: {
        resolution,
        responseText: normalizedResponseText,
      },
      metadata: {
        ...(round.metadata && typeof round.metadata === "object"
          ? round.metadata
          : {}),
        ...basePayload,
        resolution,
        xpDelta,
      },
    })
    .eq("id", roundId)
    .eq("player_id", playerId)
    .is("resolved_at", null)
    .select(
      "id, player_id, game_slug, status, started_at, timer_started_at, timer_deadline_at, resolved_at, resolution, response_payload, metadata"
    )
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRound) {
    throw new WheelRoundAlreadyResolvedError();
  }

  const updatedRoundRecord = updatedRound as GameRoundRow;

  if (xpDelta !== 0) {
    const { error: xpError } = await supabase.from("xp_transactions").insert({
      player_id: playerId,
      game_slug: WHEEL_GAME_SLUG,
      round_id: roundId,
      reason: getWheelXpReason(resolution),
      delta: xpDelta,
      metadata: {
        ...basePayload,
        resolution,
        responseText: normalizedResponseText,
      },
    });

    if (xpError) {
      await supabase
        .from("game_rounds")
        .update({
          status: round.status,
          timer_started_at: round.timer_started_at,
          timer_deadline_at: round.timer_deadline_at,
          resolved_at: round.resolved_at,
          resolution: round.resolution,
          response_payload: round.response_payload,
          metadata: round.metadata,
        })
        .eq("id", roundId)
        .eq("player_id", playerId);

      throw xpError;
    }
  }

  void Promise.all([
    logActivityEvent({
      playerId,
      roundId,
      eventType: `wheel.round.${resolution}`,
      visibility: "feed",
      payload: {
        ...basePayload,
        resolution,
        xpDelta,
        responseText: normalizedResponseText,
      },
    }),
    logActivityEvent({
      playerId,
      roundId,
      eventType: xpDelta >= 0 ? "xp.awarded" : "xp.penalized",
      visibility: "feed",
      payload: {
        amount: xpDelta,
        reason: getWheelXpReason(resolution),
        categorySlug: category.slug,
        taskKey: task.task_key,
      },
    }),
  ]);

  const playerSnapshot = await getPlayerSnapshotByPlayerId(playerId);
  if (!playerSnapshot) {
    throw new Error("Failed to read player snapshot after wheel resolution.");
  }

  const roundSnapshot = mapWheelRoundSnapshot({
    round: updatedRoundRecord,
    category,
    task,
    locale,
    spinAngle,
  });

  return {
    player: playerSnapshot,
    round: {
      ...roundSnapshot,
      resolution,
      xpDelta,
      responseText: normalizedResponseText,
    },
  };
}
