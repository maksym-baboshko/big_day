import "server-only";

import type { SupportedLocale } from "@/shared/config";
import type { DeferredTask } from "@/shared/lib/server";
import type {
  WheelRoundResolution,
  WheelRoundResolutionReason,
} from "../types";
import type { JsonObject } from "./repository-helpers";
import {
  asJsonObject,
  getWheelRoundPayload,
  getWheelXpDelta,
  getWheelXpReason,
  hasMeaningfulTextResponse,
  hasValidChoiceResponse,
  mapWheelRoundSnapshot,
  normalizeOptionalResponseText,
} from "./repository-helpers";
import { getSupabaseAdminClient } from "./supabase";
import { WHEEL_GAME_SLUG } from "./queries";
import { getPlayerSnapshotByPlayerId } from "./player-repository";
import { broadcastLeaderboardSignal, broadcastLiveSnapshot } from "./broadcast-repository";
import {
  buildActivityEvents,
  buildEventSnapshot,
  buildRoundMetadata,
  getSynchronizedRemainingSeconds,
  getWheelRoundById,
  getWheelRoundContext,
  InvalidWheelRoundResponseError,
  InvalidWheelRoundStateError,
  requireReadyPlayerProfile,
  WheelRoundAlreadyResolvedError,
} from "./wheel-round-shared";

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
  const profile = await requireReadyPlayerProfile(playerId);

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

  const { timerDurationSeconds, synchronizedRemainingSeconds } =
    getSynchronizedRemainingSeconds(round, task);

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
      p_round_metadata: buildRoundMetadata(
        asJsonObject(round.metadata),
        payload,
        resolution,
        resolutionReason,
        xpDelta
      ),
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

  const updatedRoundRecord = await getWheelRoundById(
    normalizedResolvedRoundId,
    playerId
  );
  if (!updatedRoundRecord) {
    throw new Error("Failed to read wheel round after atomic resolve.");
  }

  const deferredTasks: DeferredTask[] = [];

  if (xpDelta !== 0) {
    deferredTasks.push(
      {
        label: "broadcast_leaderboard_signal",
        run: () => broadcastLeaderboardSignal(WHEEL_GAME_SLUG),
      },
      {
        label: "broadcast_live_snapshot",
        run: () => broadcastLiveSnapshot(),
      }
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
