import "server-only";

import type { GameSlug } from "@/shared/config";
import type {
  GameLeaderboardSnapshot,
} from "../types";
import type {
  LeaderboardGameViewRow,
  LeaderboardGlobalViewRow,
  LiveFeedViewRow,
} from "./types";
import {
  isRenderableLiveFeedRow,
  mapLeaderboardEntry,
  mapLiveFeedEntry,
  mapPlayerSnapshot,
} from "./repository-helpers";
import { getSupabaseAdminClient } from "./supabase";
import { LEADERBOARD_GAME_SELECT, LEADERBOARD_GLOBAL_SELECT, LIVE_FEED_SELECT } from "./queries";

export async function getGlobalLeaderboard(limit = 10) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leaderboard_global_view")
    .select(LEADERBOARD_GLOBAL_SELECT)
    .eq("onboarding_completed", true)
    .not("nickname", "is", null)
    .gt("total_points", 0)
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as LeaderboardGlobalViewRow[]).map(mapLeaderboardEntry);
}

export async function getGameLeaderboard({
  gameSlug,
  playerId,
  topLimit = 5,
  windowRadius = 2,
}: {
  gameSlug: GameSlug;
  playerId: string;
  topLimit?: number;
  windowRadius?: number;
}): Promise<GameLeaderboardSnapshot> {
  const supabase = getSupabaseAdminClient();
  const [topResponse, playerEntryResponse] = await Promise.all([
    supabase
      .from("leaderboard_game_view")
      .select(LEADERBOARD_GAME_SELECT)
      .eq("game_slug", gameSlug)
      .eq("onboarding_completed", true)
      .not("nickname", "is", null)
      .gt("total_points", 0)
      .order("rank", { ascending: true })
      .limit(topLimit),
    supabase
      .from("leaderboard_game_view")
      .select(LEADERBOARD_GAME_SELECT)
      .eq("game_slug", gameSlug)
      .eq("player_id", playerId)
      .eq("onboarding_completed", true)
      .not("nickname", "is", null)
      .gt("total_points", 0)
      .maybeSingle(),
  ]);

  if (topResponse.error) {
    throw topResponse.error;
  }

  if (playerEntryResponse.error) {
    throw playerEntryResponse.error;
  }

  const playerEntry = (playerEntryResponse.data as LeaderboardGameViewRow | null) ?? null;
  let playerWindow: LeaderboardGameViewRow[] = [];

  if (playerEntry) {
    const startRank = Math.max(1, playerEntry.rank - windowRadius);
    const endRank = playerEntry.rank + windowRadius;
    const { data, error } = await supabase
      .from("leaderboard_game_view")
      .select(LEADERBOARD_GAME_SELECT)
      .eq("game_slug", gameSlug)
      .eq("onboarding_completed", true)
      .not("nickname", "is", null)
      .gt("total_points", 0)
      .gte("rank", startRank)
      .lte("rank", endRank)
      .order("rank", { ascending: true });

    if (error) {
      throw error;
    }

    playerWindow = (data ?? []) as LeaderboardGameViewRow[];
  }

  return {
    gameSlug,
    currentPlayerId: playerId,
    top: ((topResponse.data ?? []) as LeaderboardGameViewRow[]).map(mapLeaderboardEntry),
    playerEntry: playerEntry ? mapLeaderboardEntry(playerEntry) : null,
    playerWindow: playerWindow.map(mapLeaderboardEntry),
  };
}

export async function getLivePageSnapshot({
  leaderboardLimit = 10,
  feedLimit = 5,
}: {
  leaderboardLimit?: number;
  feedLimit?: number;
} = {}) {
  const [leaderboard, feed] = await Promise.all([
    getGlobalLeaderboard(leaderboardLimit),
    (async () => {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("live_feed_view")
        .select(LIVE_FEED_SELECT)
        .order("created_at", { ascending: false })
        .limit(Math.max(feedLimit * 8, 24));

      if (error) {
        throw error;
      }

      return ((data ?? []) as LiveFeedViewRow[])
        .filter(isRenderableLiveFeedRow)
        .slice(0, feedLimit)
        .map(mapLiveFeedEntry);
    })(),
  ]);

  return { leaderboard, feed };
}

export async function getPlayerSnapshotForLeaderboard(playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leaderboard_global_view")
    .select(LEADERBOARD_GLOBAL_SELECT)
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPlayerSnapshot(data as LeaderboardGlobalViewRow) : null;
}
