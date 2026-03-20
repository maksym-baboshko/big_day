import "server-only";

import type { SupportedLocale } from "@/shared/config";
import type {
  WheelRoundResolution,
  WheelRoundResolutionReason,
} from "../types";
import type {
  GameRoundRow,
  GameSessionRow,
  JsonValue,
  PlayerProfileRow,
  WheelCategoryRow,
  WheelRoundAssignmentRow,
  WheelTaskRow,
} from "./types";
import {
  asJsonObject,
  buildEventSnapshot,
  clampRemainingSeconds,
  computeServerRemainingSeconds,
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
import { PlayerProfileNotReadyError, getPlayerProfileById } from "./player-repository";
import { getWheelSessionById } from "./wheel-session-repository";
import {
  getWheelCategoryById,
  getWheelTaskById,
} from "./wheel-content-repository";

export {
  PlayerProfileNotReadyError,
  WheelTasksDepletedError,
  WheelRoundNotFoundError,
  WheelRoundAlreadyResolvedError,
  InvalidWheelRoundResponseError,
  InvalidWheelRoundStateError,
};

export interface WheelRoundContext {
  round: GameRoundRow;
  assignment: WheelRoundAssignmentRow;
  category: WheelCategoryRow;
  task: WheelTaskRow;
  session: GameSessionRow;
}

export async function requireReadyPlayerProfile(
  playerId: string
): Promise<PlayerProfileRow> {
  const profile = await getPlayerProfileById(playerId);

  if (!profile?.onboarding_completed || !profile.display_name) {
    throw new PlayerProfileNotReadyError();
  }

  return profile;
}

export async function getWheelRoundById(roundId: string, playerId: string) {
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

export async function getOpenWheelRoundForSession(
  sessionId: string,
  playerId: string
) {
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

export async function getWheelRoundContext(
  roundId: string,
  playerId: string
): Promise<WheelRoundContext> {
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

export async function updateRunningRoundToPaused(
  round: GameRoundRow,
  playerId: string
) {
  if (round.timer_status !== "running") {
    return round;
  }

  const supabase = getSupabaseAdminClient();
  const pausedAt = new Date().toISOString();
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

export function buildActivityEvents({
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

export function buildRoundMetadata(
  roundMetadata: JsonObject,
  payload: JsonObject,
  resolution: WheelRoundResolution,
  resolutionReason: WheelRoundResolutionReason,
  xpDelta: number
) {
  return {
    ...asJsonObject(roundMetadata),
    ...payload,
    resolution,
    resolutionReason,
    xpDelta,
  } satisfies JsonObject;
}

export function getSynchronizedRemainingSeconds(
  round: Pick<
    GameRoundRow,
    | "timer_status"
    | "timer_duration_seconds"
    | "timer_remaining_seconds"
    | "timer_last_started_at"
  >,
  task: Pick<WheelTaskRow, "execution_mode" | "timer_seconds">
) {
  const timerDurationSeconds = round.timer_duration_seconds ?? task.timer_seconds ?? null;

  return {
    timerDurationSeconds,
    synchronizedRemainingSeconds:
      task.execution_mode === "timed" && timerDurationSeconds
        ? computeServerRemainingSeconds(round, task.timer_seconds)
        : null,
  };
}

export function computePausedTimerState(
  round: Pick<GameRoundRow, "timer_duration_seconds" | "timer_status" | "timer_last_started_at" | "timer_remaining_seconds">,
  task: Pick<WheelTaskRow, "timer_seconds">
) {
  const durationSeconds = round.timer_duration_seconds ?? task.timer_seconds ?? 0;
  const nextRemainingSeconds = clampRemainingSeconds(
    computeServerRemainingSeconds(round, task.timer_seconds),
    durationSeconds
  );

  return {
    durationSeconds,
    nextRemainingSeconds,
    nextTimerStatus: nextRemainingSeconds <= 0 ? "done" : "paused",
  } as const;
}

export { buildEventSnapshot };
