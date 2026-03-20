import "server-only";

import type { GameSessionRow } from "./types";
import { getSupabaseAdminClient } from "./supabase";
import { GAME_SESSION_SELECT, WHEEL_GAME_SLUG } from "./queries";

export async function getWheelSessionByPlayerId(playerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select(GAME_SESSION_SELECT)
    .eq("player_id", playerId)
    .eq("game_slug", WHEEL_GAME_SLUG)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GameSessionRow | null) ?? null;
}

export async function getWheelSessionById(sessionId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select(GAME_SESSION_SELECT)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GameSessionRow | null) ?? null;
}

export async function getOrCreateWheelSession(playerId: string) {
  const existingSession = await getWheelSessionByPlayerId(playerId);
  if (existingSession) {
    return existingSession;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      player_id: playerId,
      game_slug: WHEEL_GAME_SLUG,
      status: "active",
      current_cycle: 1,
      total_rounds: 0,
      resolved_rounds: 0,
      metadata: { source: "wheel-session" },
    })
    .select(GAME_SESSION_SELECT)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const collisionSession = await getWheelSessionByPlayerId(playerId);
      if (collisionSession) {
        return collisionSession;
      }
    }

    throw error;
  }

  if (!data) {
    throw new Error("Failed to create wheel session.");
  }

  return data as GameSessionRow;
}

export async function updateWheelSession(
  sessionId: string,
  patch: Record<string, unknown>
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select(GAME_SESSION_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to update wheel session.");
  }

  return data as GameSessionRow;
}
