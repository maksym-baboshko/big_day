import "server-only";

import type { GameSlug, SupportedLocale } from "@/shared/config";
import type {
  GameLeaderboardSnapshot,
  WheelRoundResolution,
  WheelRoundResolutionReason,
} from "../types";
import type {
  GameRoundRow,
  GameSessionRow,
  JsonValue,
  LeaderboardGameViewRow,
  LeaderboardGlobalViewRow,
  LiveFeedViewRow,
  PlayerProfileRow,
  WheelCategoryRow,
  WheelPlayerTaskHistoryRow,
  WheelRoundAssignmentRow,
  WheelTaskRow,
} from "./types";
import {
  asJsonObject,
  buildEventSnapshot,
  buildWeightedCategoryPool,
  clampRemainingSeconds,
  getAvatarKeyForPlayer,
  getCategorySpinAngle,
  getWheelRoundPayload,
  getWheelXpDelta,
  getWheelXpReason,
  hasMeaningfulTextResponse,
  hasValidChoiceResponse,
  isRenderableLiveFeedRow,
  mapLeaderboardEntry,
  mapLiveFeedEntry,
  mapPlayerSnapshot,
  mapWheelRoundSnapshot,
  normalizeDisplayName,
  normalizeOptionalResponseText,
  pickRandomItem,
  type JsonObject,
} from "./repository-helpers";
import { getSupabaseAdminClient } from "./supabase";

const WHEEL_GAME_SLUG = "wheel-of-fortune";

const LEADERBOARD_GLOBAL_SELECT =
  "player_id, nickname, avatar_key, total_points, last_scored_at, onboarding_completed, created_at, updated_at, last_seen_at, score_reached_at, rank";
const LEADERBOARD_GAME_SELECT =
  "player_id, game_slug, nickname, avatar_key, total_points, last_scored_at, onboarding_completed, score_reached_at, rank";
const PLAYER_PROFILE_SELECT =
  "id, display_name, display_name_normalized, avatar_key, locale, onboarding_completed, created_at, updated_at, last_seen_at";
const GAME_SESSION_SELECT =
  "id, player_id, game_slug, status, current_cycle, total_rounds, resolved_rounds, last_round_started_at, last_round_resolved_at, metadata, created_at, updated_at";
const GAME_ROUND_SELECT =
  "id, session_id, player_id, game_slug, status, started_at, resolved_at, resolution, resolution_reason, timer_status, timer_duration_seconds, timer_remaining_seconds, timer_last_started_at, timer_last_paused_at, timer_last_sync_at, response_payload, metadata";
const WHEEL_CATEGORY_SELECT =
  "id, slug, sort_order, weight, title_i18n, description_i18n, is_active, created_at, updated_at";
const WHEEL_TASK_SELECT =
  "id, category_id, task_key, interaction_type, response_mode, execution_mode, allow_promise, allow_early_completion, difficulty, prompt_i18n, details_i18n, base_xp, promise_xp, skip_penalty_xp, timeout_penalty_xp, timer_seconds, feed_safe, requires_other_guest, phone_allowed, public_speaking, physical_contact_level, couple_centric, is_active, metadata, created_at, updated_at";
const WHEEL_ASSIGNMENT_SELECT =
  "round_id, category_id, task_id, spin_angle, cycle_number, selection_rank, created_at";
const LIVE_FEED_SELECT =
  "id, session_id, player_id, game_slug, round_id, event_type, visibility, payload, snapshot_name, snapshot_avatar_key, snapshot_prompt_i18n, snapshot_answer_text, snapshot_xp_delta, is_hero_event, created_at";

export class PlayerProfileNotReadyError extends Error {
  constructor() {
    super("The player profile is not ready yet.");
    this.name = "PlayerProfileNotReadyError";
  }
}

export class WheelTasksDepletedError extends Error {
  constructor() {
    super("No wheel tasks remain for this player.");
    this.name = "WheelTasksDepletedError";
  }
}

export class WheelRoundNotFoundError extends Error {
  constructor() {
    super("The wheel round was not found.");
    this.name = "WheelRoundNotFoundError";
  }
}

export class WheelRoundAlreadyResolvedError extends Error {
  constructor() {
    super("The wheel round is already resolved.");
    this.name = "WheelRoundAlreadyResolvedError";
  }
}

export class InvalidWheelRoundResponseError extends Error {
  constructor() {
    super("The wheel round response is invalid.");
    this.name = "InvalidWheelRoundResponseError";
  }
}

export class InvalidWheelRoundStateError extends Error {
  constructor() {
    super("The wheel round state is invalid.");
    this.name = "InvalidWheelRoundStateError";
  }
}


async function getPlayerSnapshotByPlayerId(playerId: string) {
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

async function getPlayerProfileById(playerId: string) {
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
    top: ((topResponse.data ?? []) as LeaderboardGameViewRow[]).map(
      mapLeaderboardEntry
    ),
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

  return {
    leaderboard,
    feed,
  };
}

async function getWheelSessionByPlayerId(playerId: string) {
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

async function getWheelSessionById(sessionId: string) {
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

async function getOrCreateWheelSession(playerId: string) {
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
      metadata: {
        source: "wheel-session",
      },
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

async function updateWheelSession(
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

async function getActiveWheelCategories() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_categories")
    .select(WHEEL_CATEGORY_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelCategoryRow[];
}

async function getActiveWheelTasks() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_tasks")
    .select(WHEEL_TASK_SELECT)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelTaskRow[];
}

async function getWheelHistoryForCycle(sessionId: string, cycleNumber: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_player_task_history")
    .select("session_id, player_id, task_id, round_id, cycle_number, assigned_at")
    .eq("session_id", sessionId)
    .eq("cycle_number", cycleNumber);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelPlayerTaskHistoryRow[];
}

async function getRecentWheelHistoryForSession(sessionId: string, limit = 20) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_player_task_history")
    .select("session_id, player_id, task_id, round_id, cycle_number, assigned_at")
    .eq("session_id", sessionId)
    .order("assigned_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelPlayerTaskHistoryRow[];
}

async function getWheelTaskById(taskId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_tasks")
    .select(WHEEL_TASK_SELECT)
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WheelTaskRow | null) ?? null;
}

async function getWheelCategoryById(categoryId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_categories")
    .select(WHEEL_CATEGORY_SELECT)
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WheelCategoryRow | null) ?? null;
}

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

  return {
    round,
    assignment,
    category,
    task,
    session,
  };
}

async function logActivityEvent(event: {
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

async function emitRealtimeSignal(signal: {
  channel: "live-projector" | "game-leaderboard";
  gameSlug?: GameSlug | null;
  signalType: string;
  payload?: JsonValue;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("realtime_signals").insert({
    channel: signal.channel,
    game_slug: signal.gameSlug ?? null,
    signal_type: signal.signalType,
    payload: signal.payload ?? {},
  });

  if (error) {
    console.error("Realtime signal insert failed:", error);
  }
}

const LIVE_PROJECTOR_BROADCAST_CHANNEL = "live-projector-broadcast";
const LIVE_PROJECTOR_BROADCAST_EVENT = "snapshot";

async function broadcastLiveSnapshot() {
  try {
    const supabase = getSupabaseAdminClient();
    const snapshot = await getLivePageSnapshot({ leaderboardLimit: 10, feedLimit: 5 });
    const channel = supabase.channel(LIVE_PROJECTOR_BROADCAST_CHANNEL);
    const result = await channel.httpSend(LIVE_PROJECTOR_BROADCAST_EVENT, snapshot);
    await supabase.removeChannel(channel);
    if (!result.success) {
      console.error("Live snapshot broadcast failed:", result.error);
    }
  } catch (error) {
    console.error("Live snapshot broadcast failed:", error);
  }
}

function buildSelectableTaskGroups({
  categories,
  tasks,
  usedTaskIds,
  recentTaskIds,
}: {
  categories: readonly WheelCategoryRow[];
  tasks: readonly WheelTaskRow[];
  usedTaskIds: Set<string>;
  recentTaskIds: Set<string>;
}) {
  return categories
    .map((category) => {
      const eligibleTasks = tasks.filter(
        (task) => task.category_id === category.id && !usedTaskIds.has(task.id)
      );

      if (eligibleTasks.length === 0) {
        return null;
      }

      const preferredTasks = eligibleTasks.filter((task) => !recentTaskIds.has(task.id));

      return {
        category,
        tasks: preferredTasks.length > 0 ? preferredTasks : eligibleTasks,
      };
    })
    .filter(Boolean) as { category: WheelCategoryRow; tasks: WheelTaskRow[] }[];
}

async function ensureWheelSessionCycle(
  session: GameSessionRow,
  totalTaskCount: number
) {
  let cycleNumber = session.current_cycle;
  let cycleHistory = await getWheelHistoryForCycle(session.id, cycleNumber);

  if (cycleHistory.length < totalTaskCount) {
    return { session, cycleNumber, cycleHistory };
  }

  const updatedSession = await updateWheelSession(session.id, {
    current_cycle: session.current_cycle + 1,
  });

  cycleNumber = updatedSession.current_cycle;
  cycleHistory = [];

  return {
    session: updatedSession,
    cycleNumber,
    cycleHistory,
  };
}

async function updateRunningRoundToPaused(
  round: GameRoundRow,
  playerId: string
) {
  if (round.timer_status !== "running") {
    return round;
  }

  const supabase = getSupabaseAdminClient();
  const pausedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("game_rounds")
    .update({
      timer_status:
        (round.timer_remaining_seconds ?? round.timer_duration_seconds ?? 0) <= 0
          ? "done"
          : "paused",
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
    {
      onConflict: "id",
    }
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

  void emitRealtimeSignal({
    channel: "live-projector",
    gameSlug: WHEEL_GAME_SLUG,
    signalType: shouldLogJoin ? "player.joined" : "player.profile.updated",
    payload: {
      playerId: authUserId,
    },
  });

  void emitRealtimeSignal({
    channel: "game-leaderboard",
    gameSlug: WHEEL_GAME_SLUG,
    signalType: "player.profile.updated",
    payload: {
      playerId: authUserId,
    },
  });

  void broadcastLiveSnapshot();

  return playerSnapshot;
}

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
    return {
      round: null,
    };
  }

  const openRound = await getOpenWheelRoundForSession(session.id, playerId);
  if (!openRound) {
    return {
      round: null,
    };
  }

  const { assignment, category, task } = await getWheelRoundContext(openRound.id, playerId);
  const restoredRound =
    task.execution_mode === "timed" && openRound.timer_status === "running"
      ? await updateRunningRoundToPaused(openRound, playerId)
      : openRound;

  return {
    round: mapWheelRoundSnapshot({
      round: restoredRound,
      assignment,
      category,
      task,
      locale,
    }),
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
      round: mapWheelRoundSnapshot({
        round,
        assignment,
        category,
        task,
        locale,
      }),
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
  const payload = getWheelRoundPayload({
    round: roundRecord,
    assignment,
    category,
    task,
    locale,
  });

  void logActivityEvent({
    sessionId: roundRecord.session_id,
    playerId,
    roundId,
    eventType: "wheel.round.timer_started",
    visibility: "private",
    payload,
  });

  return {
    round: mapWheelRoundSnapshot({
      round: roundRecord,
      assignment,
      category,
      task,
      locale,
    }),
  };
}

export async function pauseWheelRoundTimer({
  playerId,
  roundId,
  locale,
  remainingSeconds,
}: {
  playerId: string;
  roundId: string;
  locale: SupportedLocale;
  remainingSeconds?: number | null;
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
      round: mapWheelRoundSnapshot({
        round,
        assignment,
        category,
        task,
        locale,
      }),
    };
  }

  const durationSeconds = round.timer_duration_seconds ?? task.timer_seconds;
  const nextRemainingSeconds = clampRemainingSeconds(
    remainingSeconds ?? round.timer_remaining_seconds ?? durationSeconds,
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
    round: mapWheelRoundSnapshot({
      round: roundRecord,
      assignment,
      category,
      task,
      locale,
    }),
  };
}

export async function resolveWheelRound({
  playerId,
  roundId,
  locale,
  resolution,
  responseText,
  remainingSeconds,
}: {
  playerId: string;
  roundId: string;
  locale: SupportedLocale;
  resolution: WheelRoundResolution;
  responseText?: string | null;
  remainingSeconds?: number | null;
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
      ? clampRemainingSeconds(
          remainingSeconds ??
            round.timer_remaining_seconds ??
            timerDurationSeconds,
          timerDurationSeconds
        )
      : null;

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
  const activityEvents: JsonValue[] = [
    {
      event_type: `wheel.round.${resolution}`,
      visibility: "private",
      payload: roundActivityPayload,
      snapshot_name: eventSnapshot.snapshotName ?? null,
      snapshot_avatar_key: eventSnapshot.snapshotAvatarKey ?? null,
      snapshot_prompt_i18n: eventSnapshot.snapshotPromptI18n ?? {},
      snapshot_answer_text: eventSnapshot.snapshotAnswerText ?? null,
      snapshot_xp_delta: eventSnapshot.snapshotXpDelta ?? null,
    },
  ];

  if (shouldPublishCompletedResponse) {
    activityEvents.push({
      event_type: "wheel.round.completed",
      visibility: "feed",
      payload: {
        ...roundActivityPayload,
        locale,
      },
      snapshot_name: eventSnapshot.snapshotName ?? null,
      snapshot_avatar_key: eventSnapshot.snapshotAvatarKey ?? null,
      snapshot_prompt_i18n: eventSnapshot.snapshotPromptI18n ?? {},
      snapshot_answer_text: eventSnapshot.snapshotAnswerText ?? null,
      snapshot_xp_delta: eventSnapshot.snapshotXpDelta ?? null,
    });
  }

  if (resolution === "promised") {
    activityEvents.push({
      event_type: "wheel.round.promised",
      visibility: "feed",
      payload: {
        ...roundActivityPayload,
        heroEvent: true,
      },
      snapshot_name: eventSnapshot.snapshotName ?? null,
      snapshot_avatar_key: eventSnapshot.snapshotAvatarKey ?? null,
      snapshot_prompt_i18n: eventSnapshot.snapshotPromptI18n ?? {},
      snapshot_answer_text: eventSnapshot.snapshotAnswerText ?? null,
      snapshot_xp_delta: eventSnapshot.snapshotXpDelta ?? null,
    });
  }

  if (xpDelta > 0 && !shouldPublishCompletedResponse) {
    activityEvents.push({
      event_type: "xp.awarded",
      visibility: "feed",
      payload: {
        amount: xpDelta,
        locale,
      },
      snapshot_name: profile.display_name,
      snapshot_avatar_key: profile.avatar_key,
      snapshot_prompt_i18n: eventSnapshot.snapshotPromptI18n ?? {},
      snapshot_answer_text: eventSnapshot.snapshotAnswerText ?? null,
      snapshot_xp_delta: xpDelta,
    });
  }

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

  if (xpDelta !== 0) {
    void emitRealtimeSignal({
      channel: "live-projector",
      gameSlug: WHEEL_GAME_SLUG,
      signalType: "leaderboard.updated",
      payload: {
        playerId,
        roundId,
        resolution,
        resolutionReason,
        xpDelta,
      },
    });

    void emitRealtimeSignal({
      channel: "game-leaderboard",
      gameSlug: WHEEL_GAME_SLUG,
      signalType: "leaderboard.updated",
      payload: {
        playerId,
        roundId,
        resolution,
        resolutionReason,
        xpDelta,
      },
    });

    void broadcastLiveSnapshot();
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
  };
}
