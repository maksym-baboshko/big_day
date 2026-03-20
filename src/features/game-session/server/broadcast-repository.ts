import "server-only";

import type { GameSlug } from "@/shared/config";
import { getSupabaseAdminClient } from "./supabase";
import { getLivePageSnapshot } from "./leaderboard-repository";

const LIVE_PROJECTOR_BROADCAST_CHANNEL = "live-projector-broadcast";
const LIVE_PROJECTOR_BROADCAST_EVENT = "snapshot";

const WHEEL_LEADERBOARD_BROADCAST_CHANNEL = "wheel-leaderboard-broadcast";
const WHEEL_LEADERBOARD_BROADCAST_EVENT = "updated";

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
    console.error("[broadcast] live-projector snapshot query failed", { error });
    return;
  }

  try {
    const result = await getLiveProjectorChannel().httpSend(
      LIVE_PROJECTOR_BROADCAST_EVENT,
      snapshot
    );
    if (!result.success) {
      console.error("[broadcast] live-projector httpSend rejected", {
        channel: LIVE_PROJECTOR_BROADCAST_CHANNEL,
        event: LIVE_PROJECTOR_BROADCAST_EVENT,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[broadcast] live-projector httpSend threw", {
      channel: LIVE_PROJECTOR_BROADCAST_CHANNEL,
      event: LIVE_PROJECTOR_BROADCAST_EVENT,
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
      console.error("[broadcast] wheel-leaderboard httpSend rejected", {
        channel: WHEEL_LEADERBOARD_BROADCAST_CHANNEL,
        event: WHEEL_LEADERBOARD_BROADCAST_EVENT,
        gameSlug,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[broadcast] wheel-leaderboard httpSend threw", {
      channel: WHEEL_LEADERBOARD_BROADCAST_CHANNEL,
      event: WHEEL_LEADERBOARD_BROADCAST_EVENT,
      gameSlug,
      error,
    });
  }
}
