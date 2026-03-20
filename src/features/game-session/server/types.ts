import type {
  GameSlug,
  SupportedLocale,
  WheelDifficulty,
  WheelExecutionMode,
  WheelInteractionType,
  WheelPhysicalContactLevel,
  WheelResponseMode,
} from "@/shared/config";
import type {
  Database as SupabaseDatabase,
  Functions as SupabaseFunctionReturns,
  Json,
  Tables as SupabaseTableRow,
  TablesUpdate as SupabaseTableUpdate,
  Views as SupabaseViewRow,
} from "./supabase-types.generated";
import type {
  LiveFeedEventType,
  WheelRoundResolution,
  WheelRoundResolutionReason,
  WheelRoundTimerStatus,
} from "../types";

type Override<Raw, Strict extends object> = Omit<Raw, keyof Strict> & Strict;

export type JsonValue = Json;
export type GamesDatabase = SupabaseDatabase;

export type GameSessionStatus = "active";
export type GameRoundStatus = "open" | "resolved";
export type WheelRoundTimerPersistenceStatus =
  | "none"
  | WheelRoundTimerStatus;
export type ActivityVisibility = "private" | "feed";
export type ActivityEventType =
  | LiveFeedEventType
  | "wheel.round.timer_started"
  | "wheel.round.skipped";
export type RealtimeSignalChannel = "live-projector" | "game-leaderboard";
export type RealtimeSignalType = "snapshot" | "updated";
export type XpTransactionReason =
  | "wheel_round_completed"
  | "wheel_round_promised"
  | "wheel_round_timed_out"
  | "wheel_round_skipped";

export type PlayerProfileRow = Override<
  SupabaseTableRow<"player_profiles">,
  {
    locale: SupportedLocale;
  }
>;

export type GameSessionRow = Override<
  SupabaseTableRow<"game_sessions">,
  {
    game_slug: GameSlug;
    status: GameSessionStatus;
    metadata: JsonValue;
  }
>;

export type GameSessionUpdateInput = Override<
  SupabaseTableUpdate<"game_sessions">,
  {
    game_slug?: GameSlug;
    status?: GameSessionStatus;
    metadata?: JsonValue;
  }
>;

export type GameRoundRow = Override<
  SupabaseTableRow<"game_rounds">,
  {
    session_id: string;
    game_slug: GameSlug;
    status: GameRoundStatus;
    resolution: WheelRoundResolution | null;
    resolution_reason: WheelRoundResolutionReason | null;
    timer_status: WheelRoundTimerPersistenceStatus;
    response_payload: JsonValue;
    metadata: JsonValue;
  }
>;

export type ActivityEventRow = Override<
  SupabaseTableRow<"activity_events">,
  {
    game_slug: GameSlug;
    event_type: ActivityEventType;
    visibility: ActivityVisibility;
    payload: JsonValue;
    snapshot_prompt_i18n: JsonValue;
  }
>;

export type RealtimeSignalRow = Override<
  SupabaseTableRow<"realtime_signals">,
  {
    channel: RealtimeSignalChannel;
    game_slug: GameSlug | null;
    signal_type: RealtimeSignalType;
    payload: JsonValue;
  }
>;

export type RequestRateLimitRow = SupabaseTableRow<"request_rate_limits">;

export type ConsumeRateLimitWindowResult =
  SupabaseFunctionReturns<"consume_rate_limit_window">[number];

export type XpTransactionRow = Override<
  SupabaseTableRow<"xp_transactions">,
  {
    game_slug: GameSlug;
    reason: XpTransactionReason;
    event_snapshot: JsonValue;
    metadata: JsonValue;
  }
>;

export type WheelCategoryRow = Override<
  SupabaseTableRow<"wheel_categories">,
  {
    title_i18n: JsonValue;
    description_i18n: JsonValue;
  }
>;

export type WheelTaskRow = Override<
  SupabaseTableRow<"wheel_tasks">,
  {
    interaction_type: WheelInteractionType;
    response_mode: WheelResponseMode;
    execution_mode: WheelExecutionMode;
    difficulty: WheelDifficulty;
    prompt_i18n: JsonValue;
    details_i18n: JsonValue;
    physical_contact_level: WheelPhysicalContactLevel;
    metadata: JsonValue;
  }
>;

export type WheelRoundAssignmentRow = SupabaseTableRow<"wheel_round_assignments">;

export type WheelPlayerTaskHistoryRow = SupabaseTableRow<"wheel_player_task_history">;

export type LeaderboardViewRow = SupabaseViewRow<"leaderboard_view">;

export type LeaderboardGlobalViewRow = SupabaseViewRow<"leaderboard_global_view">;

export type LeaderboardGameViewRow = Override<
  SupabaseViewRow<"leaderboard_game_view">,
  {
    game_slug: GameSlug;
  }
>;

export type LiveFeedViewRow = Override<
  SupabaseViewRow<"live_feed_view">,
  {
    game_slug: GameSlug;
    payload: JsonValue;
    snapshot_prompt_i18n: JsonValue;
  }
>;

export type WheelRoundPayload = Record<string, JsonValue> & {
  sessionId: string;
  cycleNumber: number;
  selectionRank: number;
  categorySlug: string;
  categoryTitle: string;
  taskKey: string;
  interactionType: WheelInteractionType;
  responseMode: WheelResponseMode;
  executionMode: WheelExecutionMode;
  allowPromise: boolean;
  allowEarlyCompletion: boolean;
  difficulty: WheelDifficulty;
  prompt: string;
  details?: string | null;
  choiceOptions?: string[] | null;
  timerSeconds?: number | null;
  completionXp: number;
  promiseXp: number;
  skipPenaltyXp: number;
  timeoutPenaltyXp: number;
  locale: string;
  spinAngle: number;
  timerStatus?: string | null;
  timerDurationSeconds?: number | null;
  timerRemainingSeconds?: number | null;
  timerLastStartedAt?: string | null;
  timerLastPausedAt?: string | null;
};
