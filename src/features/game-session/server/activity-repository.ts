import "server-only";

import type { JsonValue } from "./types";
import { getSupabaseAdminClient } from "./supabase";
import { WHEEL_GAME_SLUG } from "./queries";

export async function logActivityEvent(event: {
  sessionId?: string | null;
  playerId: string | null;
  roundId?: string | null;
  eventType: string;
  visibility: "private" | "feed";
  payload: JsonValue;
  snapshotName?: string | null;
  snapshotAvatarKey?: string | null;
  snapshotPromptI18n?: JsonValue;
  snapshotAnswerText?: string | null;
  snapshotXpDelta?: number | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("activity_events").insert({
    session_id: event.sessionId ?? null,
    player_id: event.playerId,
    game_slug: WHEEL_GAME_SLUG,
    round_id: event.roundId ?? null,
    event_type: event.eventType,
    visibility: event.visibility,
    payload: event.payload,
    snapshot_name: event.snapshotName ?? null,
    snapshot_avatar_key: event.snapshotAvatarKey ?? null,
    snapshot_prompt_i18n: event.snapshotPromptI18n ?? {},
    snapshot_answer_text: event.snapshotAnswerText ?? null,
    snapshot_xp_delta: event.snapshotXpDelta ?? null,
  });

  if (error) {
    console.error("Activity event insert failed:", error);
  }
}
