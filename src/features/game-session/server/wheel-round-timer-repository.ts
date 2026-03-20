import "server-only";

import type { SupportedLocale } from "@/shared/config";
import type { DeferredTask } from "@/shared/lib/server";
import { getWheelRoundPayload, mapWheelRoundSnapshot } from "./repository-helpers";
import { getSupabaseAdminClient } from "./supabase";
import { GAME_ROUND_SELECT } from "./queries";
import { logActivityEvent } from "./activity-repository";
import {
  computePausedTimerState,
  getWheelRoundContext,
  InvalidWheelRoundStateError,
  requireReadyPlayerProfile,
  WheelRoundAlreadyResolvedError,
} from "./wheel-round-shared";
import type { GameRoundRow } from "./types";

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
  await requireReadyPlayerProfile(playerId);

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
        round.timer_remaining_seconds ??
        round.timer_duration_seconds ??
        task.timer_seconds,
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
  const payload = getWheelRoundPayload({
    round: roundRecord,
    assignment,
    category,
    task,
    locale,
  });

  const deferredTasks: DeferredTask[] = [
    {
      label: "log_wheel_timer_started",
      run: () =>
        logActivityEvent({
          sessionId: roundRecord.session_id,
          playerId,
          roundId,
          eventType: "wheel.round.timer_started",
          visibility: "private",
          payload,
        }),
    },
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
  await requireReadyPlayerProfile(playerId);

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

  const { durationSeconds, nextRemainingSeconds, nextTimerStatus } =
    computePausedTimerState(round, task);
  const pausedAt = new Date().toISOString();

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
