import type { GameSlug, SupportedLocale } from "@/shared/config";
import type {
  LeaderboardEntrySnapshot,
  LiveFeedEventSnapshot,
  LocalizedTextSnapshot,
  PlayerSessionSnapshot,
  WheelRoundResolution,
  WheelRoundResolutionReason,
  WheelRoundSnapshot,
  WheelRoundTimerSnapshot,
} from "../types";
import type {
  GameRoundRow,
  JsonValue,
  LeaderboardGameViewRow,
  LeaderboardGlobalViewRow,
  LiveFeedViewRow,
  PlayerProfileRow,
  WheelCategoryRow,
  WheelRoundAssignmentRow,
  WheelRoundPayload,
  WheelTaskRow,
} from "./types";
import {
  hasMeaningfulGameResponseText,
  normalizeGameResponseText,
} from "../response-text";

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

export type JsonObject = Record<string, JsonValue | undefined>;

function hashString(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getAvatarKeyForPlayer(playerId: string) {
  return PLAYER_AVATAR_KEYS[hashString(playerId) % PLAYER_AVATAR_KEYS.length];
}

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeOptionalResponseText(value?: string | null) {
  return normalizeGameResponseText(value);
}

export function hasMeaningfulTextResponse(value: string | null) {
  return hasMeaningfulGameResponseText(value);
}

export function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

export function mapPlayerSnapshot(row: LeaderboardGlobalViewRow): PlayerSessionSnapshot {
  return {
    playerId: row.player_id,
    nickname: row.nickname ?? "",
    avatarKey: row.avatar_key,
    totalPoints: row.total_points,
  };
}

export function mapLeaderboardEntry(
  row: LeaderboardGlobalViewRow | LeaderboardGameViewRow
): LeaderboardEntrySnapshot {
  return {
    playerId: row.player_id,
    nickname: row.nickname ?? "",
    avatarKey: row.avatar_key,
    totalPoints: row.total_points,
    rank: row.rank,
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

function readLocalizedTextSnapshot(value: unknown, fallback: string) {
  return {
    uk: readLocalizedText(value, "uk", fallback),
    en: readLocalizedText(value, "en", fallback),
  } satisfies Record<SupportedLocale, string>;
}

function readOptionalLocalizedTextSnapshot(value: unknown): LocalizedTextSnapshot {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const localizedRecord = value as Record<string, unknown>;
    return {
      uk: typeof localizedRecord.uk === "string" ? localizedRecord.uk : null,
      en: typeof localizedRecord.en === "string" ? localizedRecord.en : null,
    };
  }

  return {
    uk: null,
    en: null,
  };
}

function readChoiceOptions(value: unknown, locale: SupportedLocale) {
  if (!Array.isArray(value)) {
    return null;
  }

  const options = value
    .map((option) => normalizeOptionalResponseText(readLocalizedText(option, locale, "")))
    .filter((option): option is string => option !== null);

  return options.length >= 2 ? options : null;
}

function readChoiceOptionVariants(value: unknown) {
  if (!Array.isArray(value)) {
    return new Set<string>();
  }

  const variants = new Set<string>();

  for (const option of value) {
    const ukOption = normalizeOptionalResponseText(readLocalizedText(option, "uk", ""));
    const enOption = normalizeOptionalResponseText(readLocalizedText(option, "en", ""));

    if (ukOption) {
      variants.add(ukOption);
    }

    if (enOption) {
      variants.add(enOption);
    }
  }

  return variants;
}

export function getTaskChoiceOptions(
  task: Pick<WheelTaskRow, "metadata">,
  locale: SupportedLocale
) {
  return readChoiceOptions(asJsonObject(task.metadata).choiceOptions, locale);
}

export function hasValidChoiceResponse(
  task: Pick<WheelTaskRow, "metadata">,
  responseText: string | null
) {
  if (!responseText) {
    return false;
  }

  return readChoiceOptionVariants(asJsonObject(task.metadata).choiceOptions).has(
    responseText
  );
}

function hasDisplaySnapshotName(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isRenderableLiveFeedRow(row: LiveFeedViewRow) {
  switch (row.event_type) {
    case "player.joined":
      return hasDisplaySnapshotName(row.snapshot_name);
    case "xp.awarded":
      return hasDisplaySnapshotName(row.snapshot_name) && (row.snapshot_xp_delta ?? 0) > 0;
    case "wheel.round.completed":
      return hasDisplaySnapshotName(row.snapshot_name);
    case "wheel.round.promised":
      return hasDisplaySnapshotName(row.snapshot_name);
    case "leaderboard.new_top_player":
      return hasDisplaySnapshotName(row.snapshot_name);
    default:
      return false;
  }
}

export function buildWeightedCategoryPool(categories: readonly WheelCategoryRow[]) {
  return categories.flatMap((category) =>
    Array.from({ length: Math.max(category.weight, 1) }, () => category)
  );
}

export function pickRandomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function clampRemainingSeconds(value: number, durationSeconds: number) {
  return Math.min(Math.max(Math.round(value), 0), durationSeconds);
}

export function computeServerRemainingSeconds(
  round: Pick<
    GameRoundRow,
    | "timer_status"
    | "timer_last_started_at"
    | "timer_remaining_seconds"
    | "timer_duration_seconds"
  >,
  taskTimerSeconds: number | null
): number {
  const durationSeconds =
    round.timer_duration_seconds ?? taskTimerSeconds ?? 0;

  if (durationSeconds <= 0) {
    return 0;
  }

  if (round.timer_status === "running" && round.timer_last_started_at) {
    const startedAt = new Date(round.timer_last_started_at).getTime();
    const elapsed = (Date.now() - startedAt) / 1000;
    const initial =
      round.timer_remaining_seconds ?? durationSeconds;
    return clampRemainingSeconds(initial - elapsed, durationSeconds);
  }

  return clampRemainingSeconds(
    round.timer_remaining_seconds ?? durationSeconds,
    durationSeconds
  );
}

export function getCategorySpinAngle(
  categories: readonly WheelCategoryRow[],
  categoryId: string
) {
  const categoryIndex = categories.findIndex((category) => category.id === categoryId);
  const normalizedIndex = categoryIndex >= 0 ? categoryIndex : 0;
  const segmentAngle = 360 / Math.max(categories.length, 1);

  return Math.round(normalizedIndex * segmentAngle + segmentAngle / 2);
}

export function getWheelRoundTimerSnapshot({
  round,
  task,
}: {
  round: Pick<
    GameRoundRow,
    | "resolved_at"
    | "timer_status"
    | "timer_duration_seconds"
    | "timer_remaining_seconds"
    | "timer_last_started_at"
    | "timer_last_paused_at"
  >;
  task: Pick<WheelTaskRow, "execution_mode" | "timer_seconds">;
}): WheelRoundTimerSnapshot | null {
  if (task.execution_mode !== "timed") {
    return null;
  }

  const durationSeconds = round.timer_duration_seconds ?? task.timer_seconds ?? null;
  const effectiveStatus = round.resolved_at
    ? "done"
    : round.timer_status === "none"
      ? "idle"
      : round.timer_status;
  const remainingSeconds =
    effectiveStatus === "done"
      ? 0
      : round.timer_remaining_seconds ?? durationSeconds;

  return {
    status:
      effectiveStatus === "running" ||
      effectiveStatus === "paused" ||
      effectiveStatus === "done"
        ? effectiveStatus
        : "idle",
    durationSeconds,
    startedAt: round.timer_last_started_at,
    pausedAt: round.timer_last_paused_at,
    remainingSeconds,
  };
}

export function getWheelRoundPayload({
  round,
  assignment,
  category,
  task,
  locale,
}: {
  round: Pick<
    GameRoundRow,
    | "session_id"
    | "timer_status"
    | "timer_duration_seconds"
    | "timer_remaining_seconds"
    | "timer_last_started_at"
    | "timer_last_paused_at"
  >;
  assignment: Pick<WheelRoundAssignmentRow, "spin_angle" | "cycle_number" | "selection_rank">;
  category: WheelCategoryRow;
  task: WheelTaskRow;
  locale: SupportedLocale;
}): WheelRoundPayload {
  const choiceOptions = getTaskChoiceOptions(task, locale);

  return {
    sessionId: round.session_id,
    cycleNumber: assignment.cycle_number,
    selectionRank: assignment.selection_rank,
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
    choiceOptions,
    timerSeconds: task.timer_seconds,
    completionXp: task.base_xp,
    promiseXp: task.promise_xp,
    skipPenaltyXp: task.skip_penalty_xp,
    timeoutPenaltyXp: task.timeout_penalty_xp,
    locale,
    spinAngle: assignment.spin_angle,
    timerStatus: round.timer_status,
    timerDurationSeconds: round.timer_duration_seconds,
    timerRemainingSeconds: round.timer_remaining_seconds,
    timerLastStartedAt: round.timer_last_started_at,
    timerLastPausedAt: round.timer_last_paused_at,
  };
}

export function mapWheelRoundSnapshot({
  round,
  assignment,
  category,
  task,
  locale,
}: {
  round: Pick<
    GameRoundRow,
    | "id"
    | "session_id"
    | "resolved_at"
    | "timer_status"
    | "timer_duration_seconds"
    | "timer_remaining_seconds"
    | "timer_last_started_at"
    | "timer_last_paused_at"
  >;
  assignment: Pick<WheelRoundAssignmentRow, "spin_angle" | "cycle_number" | "selection_rank">;
  category: WheelCategoryRow;
  task: WheelTaskRow;
  locale: SupportedLocale;
}): WheelRoundSnapshot {
  const choiceOptions = getTaskChoiceOptions(task, locale);

  return {
    roundId: round.id,
    sessionId: round.session_id,
    cycleNumber: assignment.cycle_number,
    selectionRank: assignment.selection_rank,
    spinAngle: assignment.spin_angle,
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
      choiceOptions,
      timerSeconds: task.timer_seconds,
      completionXp: task.base_xp,
      promiseXp: task.promise_xp,
      skipPenaltyXp: task.skip_penalty_xp,
      timeoutPenaltyXp: task.timeout_penalty_xp,
    },
    timer: getWheelRoundTimerSnapshot({ round, task }),
  };
}

export function getWheelXpDelta(
  task: WheelTaskRow,
  resolution: WheelRoundResolution,
  resolutionReason: WheelRoundResolutionReason
) {
  switch (resolution) {
    case "completed":
      return task.base_xp;
    case "promised":
      return task.promise_xp;
    case "skipped":
      return resolutionReason === "timed_out"
        ? task.timeout_penalty_xp
        : task.skip_penalty_xp;
  }
}

export function getWheelXpReason(
  resolution: WheelRoundResolution,
  resolutionReason: WheelRoundResolutionReason
) {
  if (resolution === "completed") {
    return "wheel_round_completed";
  }

  if (resolution === "promised") {
    return "wheel_round_promised";
  }

  return resolutionReason === "timed_out"
    ? "wheel_round_timed_out"
    : "wheel_round_skipped";
}

function getFeedPromptSnapshot(task: WheelTaskRow) {
  return readLocalizedTextSnapshot(task.prompt_i18n, task.task_key);
}

export function buildEventSnapshot({
  profile,
  task,
  responseText,
  xpDelta,
}: {
  profile: Pick<PlayerProfileRow, "display_name" | "avatar_key">;
  task?: WheelTaskRow;
  responseText?: string | null;
  xpDelta?: number | null;
}) {
  return {
    snapshotName: profile.display_name,
    snapshotAvatarKey: profile.avatar_key,
    snapshotPromptI18n: task ? getFeedPromptSnapshot(task) : {},
    snapshotAnswerText: responseText ?? null,
    snapshotXpDelta: xpDelta ?? null,
  };
}

export function mapLiveFeedEntry(row: LiveFeedViewRow): LiveFeedEventSnapshot {
  const payload = asJsonObject(row.payload);

  return {
    id: row.id,
    gameSlug: row.game_slug as GameSlug,
    eventType: row.event_type as LiveFeedEventSnapshot["eventType"],
    locale:
      payload.locale === "uk" || payload.locale === "en"
        ? payload.locale
        : null,
    playerId: row.player_id,
    playerName: row.snapshot_name,
    avatarKey: row.snapshot_avatar_key,
    promptI18n: readOptionalLocalizedTextSnapshot(row.snapshot_prompt_i18n),
    answerText: row.snapshot_answer_text,
    xpDelta: row.snapshot_xp_delta,
    welcomeText:
      typeof payload.welcomeText === "string" ? payload.welcomeText : null,
    isHeroEvent: row.is_hero_event,
    createdAt: row.created_at,
  };
}
