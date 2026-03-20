import "server-only";

import type { SupportedLocale } from "@/shared/config";
import type { DeferredTask } from "@/shared/lib/server";
import type {
  WheelRoundResolution,
  WheelRoundResolutionReason,
} from "../types";
import type {
  GameRoundRow,
  JsonValue,
  WheelRoundAssignmentRow,
} from "./types";
import {
  asJsonObject,
  buildEventSnapshot,
  buildWeightedCategoryPool,
  clampRemainingSeconds,
  computeServerRemainingSeconds,
  getCategorySpinAngle,
  getWheelRoundPayload,
  getWheelXpDelta,
  getWheelXpReason,
  hasMeaningfulTextResponse,
  hasValidChoiceResponse,
  mapWheelRoundSnapshot,
  normalizeOptionalResponseText,
  pickRandomItem,
  type JsonObject,
} from "./repository-helpers";
import { getSupabaseAdminClient } from "./supabase";
import { GAME_ROUND_SELECT, WHEEL_ASSIGNMENT_SELECT, WHEEL_GAME_SLUG } from "./queries";
import {
  InvalidWheelRoundResponseError,
  InvalidWheelRoundStateError,
  WheelRoundAlreadyResolvedError,
  WheelRoundNotFoundError,
  WheelTasksDepletedError,
} from "./errors";
import { PlayerProfileNotReadyError, getPlayerProfileById, getPlayerSnapshotByPlayerId } from "./player-repository";
import { getOrCreateWheelSession, getWheelSessionByPlayerId, getWheelSessionById } from "./wheel-session-repository";
import {
  buildSelectableTaskGroups,
  ensureWheelSessionCycle,
  getActiveWheelCategories,
  getActiveWheelTasks,
  getRecentWheelHistoryForSession,
  getWheelCategoryById,
  getWheelTaskById,
} from "./wheel-content-repository";
import { logActivityEvent } from "./activity-repository";
import { broadcastLeaderboardSignal, broadcastLiveSnapshot } from "./broadcast-repository";

export {
  PlayerProfileNotReadyError,
  WheelTasksDepletedError,
  WheelRoundNotFoundError,
  WheelRoundAlreadyResolvedError,
  InvalidWheelRoundResponseError,
  InvalidWheelRoundStateError,
};

// ---------------------------------------------------------------------------
// Private query helpers
// ---------------------------------------------------------------------------

async function getWheelRoundById(roundId: string, playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_rounds")
    .select(GAME_ROUND_SELECT)
    .eq("id", roundId)
    .eq("player_id", playerId)
    .eq("game_slug", WHEEL_GAME_SLUG)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GameRoundRow | null) ?? null;
}

async function getOpenWheelRoundForSession(sessionId: string, playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_rounds")
    .select(GAME_ROUND_SELECT)
    .eq("session_id", sessionId)
    .eq("player_id", playerId)
    .eq("game_slug", WHEEL_GAME_SLUG)
    .eq("status", "open")
    .order("started_at", { ascending: false })
    .limit(1)
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
    .select(WHEEL_ASSIGNMENT_SELECT)
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

  const [category, task, session] = await Promise.all([
    getWheelCategoryById(assignment.category_id),
    getWheelTaskById(assignment.task_id),
    getWheelSessionById(round.session_id),
  ]);

  if (!category || !task || !session) {
    throw new WheelRoundNotFoundError();
  }

  return { round, assignment, category, task, session };
}

async function updateRunningRoundToPaused(round: GameRoundRow, playerId: string) {
  if (round.timer_status !== "running") {
    return round;
  }

  const supabase = getSupabaseAdminClient();
  const pausedAt = new Date().toISOString();
  // Compute actual remaining time server-side to account for elapsed time
  // since timer_last_started_at. Without this, a player who refreshes while
  // the timer is running gets the old remaining time restored (free extra time).
  const computedRemaining = computeServerRemainingSeconds(round, null);
  const { data, error } = await supabase
    .from("game_rounds")
    .update({
      timer_status: computedRemaining <= 0 ? "done" : "paused",
      timer_remaining_seconds: computedRemaining,
      timer_last_started_at: null,
      timer_last_paused_at: pausedAt,
      timer_last_sync_at: pausedAt,
    })
    .eq("id", round.id)
    .eq("player_id", playerId)
    .eq("status", "open")
    .select(GAME_ROUND_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GameRoundRow | null) ?? round;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getOpenWheelRound({
  playerId,
  locale,
}: {
  playerId: string;
  locale: SupportedLocale;
}) {
  const profile = await getPlayerProfileById(playerId);

  if (!profile?.onboarding_completed || !profile.display_name) {
    throw new PlayerProfileNotReadyError();
  }

  const session = await getWheelSessionByPlayerId(playerId);
  if (!session) {
    return { round: null };
  }

  const openRound = await getOpenWheelRoundForSession(session.id, playerId);
  if (!openRound) {
    return { round: null };
  }

  const { assignment, category, task } = await getWheelRoundContext(openRound.id, playerId);
  const restoredRound =
    task.execution_mode === "timed" && openRound.timer_status === "running"
      ? await updateRunningRoundToPaused(openRound, playerId)
      : openRound;

  return {
    round: mapWheelRoundSnapshot({ round: restoredRound, assignment, category, task, locale }),
  };
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

  const session = await getOrCreateWheelSession(playerId);
  const existingOpenRound = await getOpenWheelRoundForSession(session.id, playerId);

  if (existingOpenRound) {
    const { assignment, category, task } = await getWheelRoundContext(
      existingOpenRound.id,
      playerId
    );

    return {
      round: mapWheelRoundSnapshot({
        round: existingOpenRound,
        assignment,
        category,
        task,
        locale,
      }),
    };
  }

  const [categories, tasks, recentHistory] = await Promise.all([
    getActiveWheelCategories(),
    getActiveWheelTasks(),
    getRecentWheelHistoryForSession(session.id, 20),
  ]);

  if (categories.length === 0 || tasks.length === 0) {
    throw new WheelTasksDepletedError();
  }

  const sessionState = await ensureWheelSessionCycle(session, tasks.length);
  const usedTaskIds = new Set(sessionState.cycleHistory.map((entry) => entry.task_id));
  const recentTaskIds = new Set(recentHistory.map((entry) => entry.task_id));
  const availableGroups = buildSelectableTaskGroups({
    categories,
    tasks,
    usedTaskIds,
    recentTaskIds,
  });

  if (availableGroups.length === 0) {
    throw new WheelTasksDepletedError();
  }

  const weightedCategories = buildWeightedCategoryPool(
    availableGroups.map((group) => group.category)
  );
  const selectedCategory = pickRandomItem(weightedCategories);
  const selectedGroup = availableGroups.find(
    (group) => group.category.id === selectedCategory.id
  );

  if (!selectedGroup || selectedGroup.tasks.length === 0) {
    throw new WheelTasksDepletedError();
  }

  const selectedTask = pickRandomItem(selectedGroup.tasks);
  const spinAngle = getCategorySpinAngle(categories, selectedCategory.id);
  const selectionRank = sessionState.cycleHistory.length + 1;
  const startedAt = new Date().toISOString();
  const isTimedTask = selectedTask.execution_mode === "timed";
  const roundMetadata = {
    source: "wheel-round",
    locale,
    categorySlug: selectedCategory.slug,
    taskKey: selectedTask.task_key,
    cycleNumber: sessionState.cycleNumber,
    selectionRank,
  } satisfies JsonObject;
  const roundPayload = getWheelRoundPayload({
    round: {
      session_id: sessionState.session.id,
      timer_status: isTimedTask ? "idle" : "none",
      timer_duration_seconds: selectedTask.timer_seconds,
      timer_remaining_seconds: selectedTask.timer_seconds,
      timer_last_started_at: null,
      timer_last_paused_at: null,
    },
    assignment: {
      spin_angle: spinAngle,
      cycle_number: sessionState.cycleNumber,
      selection_rank: selectionRank,
    },
    category: selectedCategory,
    task: selectedTask,
    locale,
  });

  const { data: roundId, error: roundError } = await supabase.rpc(
    "start_wheel_round_atomic",
    {
      p_session_id: sessionState.session.id,
      p_player_id: playerId,
      p_started_at: startedAt,
      p_category_id: selectedCategory.id,
      p_task_id: selectedTask.id,
      p_spin_angle: spinAngle,
      p_cycle_number: sessionState.cycleNumber,
      p_selection_rank: selectionRank,
      p_timer_status: isTimedTask ? "idle" : "none",
      p_timer_duration_seconds: selectedTask.timer_seconds,
      p_timer_remaining_seconds: selectedTask.timer_seconds,
      p_round_metadata: roundMetadata,
      p_activity_payload: roundPayload,
    }
  );

  if (roundError) {
    if (roundError.code === "23505") {
      const latestOpenRound = await getOpenWheelRoundForSession(
        sessionState.session.id,
        playerId
      );

      if (latestOpenRound) {
        const { assignment, category, task } = await getWheelRoundContext(
          latestOpenRound.id,
          playerId
        );

        return {
          round: mapWheelRoundSnapshot({
            round: latestOpenRound,
            assignment,
            category,
            task,
            locale,
          }),
        };
      }
    }

    throw roundError;
  }

  const createdRoundId = normalizeOptionalResponseText(roundId);
  if (!createdRoundId) {
    throw new Error("Failed to create wheel round atomically.");
  }

  const roundRecord = await getWheelRoundById(createdRoundId, playerId);
  if (!roundRecord) {
    throw new Error("Failed to read wheel round after atomic start.");
  }

  const assignment: WheelRoundAssignmentRow = {
    round_id: roundRecord.id,
    category_id: selectedCategory.id,
    task_id: selectedTask.id,
    spin_angle: spinAngle,
    cycle_number: sessionState.cycleNumber,
    selection_rank: selectionRank,
    created_at: startedAt,
  };

  return {
    round: mapWheelRoundSnapshot({
      round: roundRecord,
      assignment,
      category: selectedCategory,
      task: selectedTask,
      locale,
    }),
  };
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

  if (round.resolved_at || round.resolution || round.status !== "open") {
    throw new WheelRoundAlreadyResolvedError();
  }

  if (task.execution_mode !== "timed" || !task.timer_seconds) {
    throw new InvalidWheelRoundStateError();
  }

  if (round.timer_status === "running") {
    return {
      round: mapWheelRoundSnapshot({ round, assignment, category, task, locale }),
    };
  }

  if (round.timer_status === "done" && (round.timer_remaining_seconds ?? 0) <= 0) {
    throw new InvalidWheelRoundStateError();
  }

  const startedAt = new Date().toISOString();
  const { data: updatedRound, error: updateError } = await supabase
    .from("game_rounds")
    .update({
      timer_status: "running",
      timer_duration_seconds: round.timer_duration_seconds ?? task.timer_seconds,
      timer_remaining_seconds:
        round.timer_remaining_seconds ?? round.timer_duration_seconds ?? task.timer_seconds,
      timer_last_started_at: startedAt,
      timer_last_sync_at: startedAt,
    })
    .eq("id", roundId)
    .eq("player_id", playerId)
    .eq("status", "open")
    .select(GAME_ROUND_SELECT)
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRound) {
    throw new InvalidWheelRoundStateError();
  }

  const roundRecord = updatedRound as GameRoundRow;
  const payload = getWheelRoundPayload({ round: roundRecord, assignment, category, task, locale });

  const deferredTasks: DeferredTask[] = [
    () =>
      logActivityEvent({
        sessionId: roundRecord.session_id,
        playerId,
        roundId,
        eventType: "wheel.round.timer_started",
        visibility: "private",
        payload,
      }),
  ];

  return {
    round: mapWheelRoundSnapshot({ round: roundRecord, assignment, category, task, locale }),
    deferredTasks,
  };
}

export async function pauseWheelRoundTimer({
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

  if (round.resolved_at || round.resolution || round.status !== "open") {
    throw new WheelRoundAlreadyResolvedError();
  }

  if (task.execution_mode !== "timed" || !task.timer_seconds) {
    throw new InvalidWheelRoundStateError();
  }

  if (round.timer_status !== "running") {
    return {
      round: mapWheelRoundSnapshot({ round, assignment, category, task, locale }),
    };
  }

  const durationSeconds = round.timer_duration_seconds ?? task.timer_seconds;
  // Always compute remaining time server-side. Accepting a client-supplied
  // value here would let any player pause with an inflated remainingSeconds,
  // then resume or resolve with extra time.
  const nextRemainingSeconds = clampRemainingSeconds(
    computeServerRemainingSeconds(round, task.timer_seconds),
    durationSeconds
  );
  const pausedAt = new Date().toISOString();
  const nextTimerStatus = nextRemainingSeconds <= 0 ? "done" : "paused";

  const { data: updatedRound, error: updateError } = await supabase
    .from("game_rounds")
    .update({
      timer_status: nextTimerStatus,
      timer_duration_seconds: durationSeconds,
      timer_remaining_seconds: nextRemainingSeconds,
      timer_last_started_at: null,
      timer_last_paused_at: pausedAt,
      timer_last_sync_at: pausedAt,
    })
    .eq("id", roundId)
    .eq("player_id", playerId)
    .eq("status", "open")
    .select(GAME_ROUND_SELECT)
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRound) {
    throw new InvalidWheelRoundStateError();
  }

  const roundRecord = updatedRound as GameRoundRow;

  return {
    round: mapWheelRoundSnapshot({ round: roundRecord, assignment, category, task, locale }),
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

  if (round.resolved_at || round.resolution || round.status !== "open") {
    throw new WheelRoundAlreadyResolvedError();
  }

  const normalizedResponseText = normalizeOptionalResponseText(responseText);

  if (
    resolution === "completed" &&
    task.response_mode === "text_input" &&
    !hasMeaningfulTextResponse(normalizedResponseText)
  ) {
    throw new InvalidWheelRoundResponseError();
  }

  if (
    resolution === "completed" &&
    task.response_mode === "choice" &&
    !hasValidChoiceResponse(task, normalizedResponseText)
  ) {
    throw new InvalidWheelRoundResponseError();
  }

  if (resolution === "promised" && !task.allow_promise) {
    throw new InvalidWheelRoundResponseError();
  }

  if (
    resolution === "completed" &&
    task.execution_mode === "timed" &&
    round.timer_status === "idle"
  ) {
    throw new InvalidWheelRoundStateError();
  }

  const timerDurationSeconds = round.timer_duration_seconds ?? task.timer_seconds ?? null;
  const synchronizedRemainingSeconds =
    task.execution_mode === "timed" && timerDurationSeconds
      ? computeServerRemainingSeconds(round, task.timer_seconds)
      : null;

  // Reject successful resolutions submitted after the timer has expired.
  // Early completion (remaining > 0) is still accepted. Without this guard,
  // a client can POST resolution: "completed" after the countdown reaches
  // zero and still receive XP instead of a timeout penalty.
  if (
    (resolution === "completed" || resolution === "promised") &&
    task.execution_mode === "timed" &&
    synchronizedRemainingSeconds === 0
  ) {
    throw new InvalidWheelRoundStateError();
  }

  const resolutionReason: WheelRoundResolutionReason =
    resolution === "skipped"
      ? task.execution_mode === "timed" && synchronizedRemainingSeconds === 0
        ? "timed_out"
        : "manual_skip"
      : "not_applicable";
  const xpDelta = getWheelXpDelta(task, resolution, resolutionReason);
  const resolvedAt = new Date().toISOString();
  const payload = getWheelRoundPayload({
    round: {
      ...round,
      timer_status:
        task.execution_mode === "timed"
          ? synchronizedRemainingSeconds === 0
            ? "done"
            : round.timer_status
          : round.timer_status,
      timer_duration_seconds: timerDurationSeconds,
      timer_remaining_seconds: synchronizedRemainingSeconds,
      timer_last_started_at: round.timer_last_started_at,
      timer_last_paused_at: round.timer_last_paused_at,
    },
    assignment,
    category,
    task,
    locale,
  });

  const eventSnapshot = buildEventSnapshot({
    profile,
    task,
    responseText: normalizedResponseText,
    xpDelta,
  });
  const shouldPublishCompletedResponse =
    resolution === "completed" && normalizedResponseText !== null;
  const roundActivityPayload = {
    ...payload,
    resolution,
    resolutionReason,
    responseText: normalizedResponseText,
    xpDelta,
  } satisfies JsonObject;

  const activityEvents = buildActivityEvents({
    eventSnapshot,
    roundActivityPayload,
    resolution,
    shouldPublishCompletedResponse,
    xpDelta,
    locale,
    profile,
  });

  const { data: resolvedRoundId, error: resolveError } = await supabase.rpc(
    "resolve_wheel_round_atomic",
    {
      p_round_id: roundId,
      p_player_id: playerId,
      p_resolved_at: resolvedAt,
      p_resolution: resolution,
      p_resolution_reason: resolutionReason,
      p_timer_status: task.execution_mode === "timed" ? "done" : round.timer_status,
      p_timer_duration_seconds: timerDurationSeconds,
      p_timer_remaining_seconds:
        task.execution_mode === "timed" ? synchronizedRemainingSeconds : null,
      p_timer_last_paused_at:
        task.execution_mode === "timed" ? resolvedAt : round.timer_last_paused_at,
      p_timer_last_sync_at:
        task.execution_mode === "timed" ? resolvedAt : round.timer_last_sync_at,
      p_response_payload: {
        resolution,
        resolutionReason,
        responseText: normalizedResponseText,
      },
      p_round_metadata: {
        ...asJsonObject(round.metadata),
        ...payload,
        resolution,
        resolutionReason,
        xpDelta,
      },
      p_xp_reason: xpDelta !== 0 ? getWheelXpReason(resolution, resolutionReason) : null,
      p_xp_delta: xpDelta,
      p_xp_event_snapshot: {
        ...eventSnapshot,
        resolution,
        resolutionReason,
      },
      p_xp_metadata: {
        ...payload,
        resolution,
        resolutionReason,
        responseText: normalizedResponseText,
      },
      p_activity_events: activityEvents,
    }
  );

  if (resolveError) {
    throw resolveError;
  }

  const normalizedResolvedRoundId = normalizeOptionalResponseText(resolvedRoundId);
  if (!normalizedResolvedRoundId) {
    throw new Error("Failed to resolve wheel round atomically.");
  }

  const updatedRoundRecord = await getWheelRoundById(normalizedResolvedRoundId, playerId);
  if (!updatedRoundRecord) {
    throw new Error("Failed to read wheel round after atomic resolve.");
  }

  const deferredTasks: DeferredTask[] = [];

  if (xpDelta !== 0) {
    deferredTasks.push(
      () => broadcastLeaderboardSignal(WHEEL_GAME_SLUG),
      () => broadcastLiveSnapshot()
    );
  }

  const playerSnapshot = await getPlayerSnapshotByPlayerId(playerId);
  if (!playerSnapshot) {
    throw new Error("Failed to read player snapshot after wheel resolution.");
  }

  return {
    player: playerSnapshot,
    round: {
      ...mapWheelRoundSnapshot({
        round: updatedRoundRecord,
        assignment,
        category,
        task,
        locale,
      }),
      resolution,
      resolutionReason,
      xpDelta,
      responseText: normalizedResponseText,
    },
    deferredTasks,
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function buildActivityEvents({
  eventSnapshot,
  roundActivityPayload,
  resolution,
  shouldPublishCompletedResponse,
  xpDelta,
  locale,
  profile,
}: {
  eventSnapshot: ReturnType<typeof buildEventSnapshot>;
  roundActivityPayload: JsonObject;
  resolution: WheelRoundResolution;
  shouldPublishCompletedResponse: boolean;
  xpDelta: number;
  locale: SupportedLocale;
  profile: { display_name: string | null; avatar_key: string | null };
}): JsonValue[] {
  const snapshotFields = {
    snapshot_name: eventSnapshot.snapshotName ?? null,
    snapshot_avatar_key: eventSnapshot.snapshotAvatarKey ?? null,
    snapshot_prompt_i18n: eventSnapshot.snapshotPromptI18n ?? {},
    snapshot_answer_text: eventSnapshot.snapshotAnswerText ?? null,
    snapshot_xp_delta: eventSnapshot.snapshotXpDelta ?? null,
  };

  const events: JsonValue[] = [
    {
      event_type: `wheel.round.${resolution}`,
      visibility: "private",
      payload: roundActivityPayload,
      ...snapshotFields,
    },
  ];

  if (shouldPublishCompletedResponse) {
    events.push({
      event_type: "wheel.round.completed",
      visibility: "feed",
      payload: { ...roundActivityPayload, locale },
      ...snapshotFields,
    });
  }

  if (resolution === "promised") {
    events.push({
      event_type: "wheel.round.promised",
      visibility: "feed",
      payload: { ...roundActivityPayload, heroEvent: true },
      ...snapshotFields,
    });
  }

  if (xpDelta > 0 && !shouldPublishCompletedResponse) {
    events.push({
      event_type: "xp.awarded",
      visibility: "feed",
      payload: { amount: xpDelta, locale },
      snapshot_name: profile.display_name,
      snapshot_avatar_key: profile.avatar_key,
      snapshot_prompt_i18n: eventSnapshot.snapshotPromptI18n ?? {},
      snapshot_answer_text: eventSnapshot.snapshotAnswerText ?? null,
      snapshot_xp_delta: xpDelta,
    });
  }

  return events;
}
