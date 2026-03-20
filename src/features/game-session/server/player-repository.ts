import "server-only";

import type { SupportedLocale } from "@/shared/config";
import type { DeferredTask } from "@/shared/lib/server";
import type { LeaderboardGlobalViewRow, PlayerProfileRow } from "./types";
import {
  getAvatarKeyForPlayer,
  mapPlayerSnapshot,
  normalizeDisplayName,
} from "./repository-helpers";
import { getSupabaseAdminClient } from "./supabase";
import {
  LEADERBOARD_GLOBAL_SELECT,
  PLAYER_PROFILE_SELECT,
  WHEEL_GAME_SLUG,
} from "./queries";
import { logActivityEvent } from "./activity-repository";
import { broadcastLeaderboardSignal, broadcastLiveSnapshot } from "./broadcast-repository";

export { PlayerProfileNotReadyError } from "./errors";

export async function getPlayerProfileById(playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("player_profiles")
    .select(PLAYER_PROFILE_SELECT)
    .eq("id", playerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PlayerProfileRow | null) ?? null;
}

export async function getPlayerSnapshotByPlayerId(playerId: string) {
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
  const existingProfile = await getPlayerProfileById(authUserId);
  const normalizedNickname = normalizeDisplayName(nickname);
  const shouldLogJoin = !existingProfile?.onboarding_completed;

  const { error } = await supabase.from("player_profiles").upsert(
    {
      id: authUserId,
      display_name: normalizedNickname,
      display_name_normalized: normalizedNickname.toLocaleLowerCase(),
      avatar_key: existingProfile?.avatar_key ?? getAvatarKeyForPlayer(authUserId),
      locale,
      onboarding_completed: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  const profile = await getPlayerProfileById(authUserId);
  const playerSnapshot = await getPlayerSnapshotByPlayerId(authUserId);

  if (!profile || !playerSnapshot) {
    throw new Error("Failed to read player snapshot after save.");
  }

  if (shouldLogJoin) {
    await logActivityEvent({
      playerId: authUserId,
      eventType: "player.joined",
      visibility: "feed",
      payload: {
        locale,
        welcomeText: locale === "uk" ? "Новий гравець у грі" : "A new player joined",
      },
      snapshotName: profile.display_name,
      snapshotAvatarKey: profile.avatar_key,
      snapshotPromptI18n: {},
      snapshotAnswerText: null,
      snapshotXpDelta: null,
    });
  }

  const deferredTasks: DeferredTask[] = [
    () => broadcastLeaderboardSignal(WHEEL_GAME_SLUG),
    () => broadcastLiveSnapshot(),
  ];

  return { player: playerSnapshot, deferredTasks };
}
