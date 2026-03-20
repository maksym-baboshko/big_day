import "server-only";

import { logServerError } from "@/shared/lib/server";
import type { GameSlug } from "@/shared/config";
import type { RealtimeSignalType } from "./types";
import { getSupabaseAdminClient } from "./supabase";
import { getLivePageSnapshot } from "./leaderboard-repository";

const LIVE_PROJECTOR_BROADCAST_CHANNEL = "live-projector-broadcast";
const LIVE_PROJECTOR_BROADCAST_EVENT: RealtimeSignalType = "snapshot";

const WHEEL_LEADERBOARD_BROADCAST_CHANNEL = "wheel-leaderboard-broadcast";
const WHEEL_LEADERBOARD_BROADCAST_EVENT: RealtimeSignalType = "updated";

let liveProjectorChannel: ReturnType<
  ReturnType<typeof getSupabaseAdminClient>["channel"]
> | null = null;

function getLiveProjectorChannel() {
  if (!liveProjectorChannel) {
    liveProjectorChannel = getSupabaseAdminClient().channel(
      LIVE_PROJECTOR_BROADCAST_CHANNEL
    );
  }
  return liveProjectorChannel;
}

let leaderboardChannel: ReturnType<
  ReturnType<typeof getSupabaseAdminClient>["channel"]
> | null = null;

function getLeaderboardChannel() {
  if (!leaderboardChannel) {
    leaderboardChannel = getSupabaseAdminClient().channel(
      WHEEL_LEADERBOARD_BROADCAST_CHANNEL
    );
  }
  return leaderboardChannel;
}

export async function broadcastLiveSnapshot() {
  let snapshot;
  try {
    snapshot = await getLivePageSnapshot({ leaderboardLimit: 10, feedLimit: 5 });
  } catch (error) {
    logServerError({
      scope: "broadcast-repository",
      event: "live_snapshot_query_failed",
      context: {
        channel: LIVE_PROJECTOR_BROADCAST_CHANNEL,
        broadcastEvent: LIVE_PROJECTOR_BROADCAST_EVENT,
      },
      error,
    });
    return;
  }

  try {
    const result = await getLiveProjectorChannel().httpSend(
      LIVE_PROJECTOR_BROADCAST_EVENT,
      snapshot
    );
    if (!result.success) {
      logServerError({
        scope: "broadcast-repository",
        event: "live_snapshot_http_send_rejected",
        context: {
          channel: LIVE_PROJECTOR_BROADCAST_CHANNEL,
          broadcastEvent: LIVE_PROJECTOR_BROADCAST_EVENT,
        },
        error: result.error,
      });
    }
  } catch (error) {
    logServerError({
      scope: "broadcast-repository",
      event: "live_snapshot_http_send_threw",
      context: {
        channel: LIVE_PROJECTOR_BROADCAST_CHANNEL,
        broadcastEvent: LIVE_PROJECTOR_BROADCAST_EVENT,
      },
      error,
    });
  }
}

export async function broadcastLeaderboardSignal(gameSlug: GameSlug) {
  try {
    const result = await getLeaderboardChannel().httpSend(
      WHEEL_LEADERBOARD_BROADCAST_EVENT,
      { gameSlug }
    );
    if (!result.success) {
      logServerError({
        scope: "broadcast-repository",
        event: "leaderboard_http_send_rejected",
        context: {
          channel: WHEEL_LEADERBOARD_BROADCAST_CHANNEL,
          broadcastEvent: WHEEL_LEADERBOARD_BROADCAST_EVENT,
          gameSlug,
        },
        error: result.error,
      });
    }
  } catch (error) {
    logServerError({
      scope: "broadcast-repository",
      event: "leaderboard_http_send_threw",
      context: {
        channel: WHEEL_LEADERBOARD_BROADCAST_CHANNEL,
        broadcastEvent: WHEEL_LEADERBOARD_BROADCAST_EVENT,
        gameSlug,
      },
      error,
    });
  }
}
