import type {
  WheelDifficulty,
  WheelExecutionMode,
  WheelInteractionType,
  WheelResponseMode,
} from "@/shared/config";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

export type PlayerProfileRow = Record<string, unknown> & {
  id: string;
  display_name: string | null;
  display_name_normalized: string | null;
  avatar_key: string;
  locale: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
};

export type GameSessionRow = Record<string, unknown> & {
  id: string;
  player_id: string;
  game_slug: string;
  status: string;
  current_cycle: number;
  total_rounds: number;
  resolved_rounds: number;
  last_round_started_at: string | null;
  last_round_resolved_at: string | null;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
};

export type GameRoundRow = Record<string, unknown> & {
  id: string;
  session_id: string;
  player_id: string;
  game_slug: string;
  status: string;
  started_at: string;
  resolved_at: string | null;
  resolution: string | null;
  resolution_reason: string | null;
  timer_status: string;
  timer_duration_seconds: number | null;
  timer_remaining_seconds: number | null;
  timer_last_started_at: string | null;
  timer_last_paused_at: string | null;
  timer_last_sync_at: string | null;
  response_payload: JsonValue;
  metadata: JsonValue;
};

export type ActivityEventRow = Record<string, unknown> & {
  id: string;
  session_id: string | null;
  player_id: string | null;
  game_slug: string;
  round_id: string | null;
  event_type: string;
  visibility: string;
  payload: JsonValue;
  snapshot_name: string | null;
  snapshot_avatar_key: string | null;
  snapshot_prompt_i18n: JsonValue;
  snapshot_answer_text: string | null;
  snapshot_xp_delta: number | null;
  created_at: string;
};

export type RealtimeSignalRow = Record<string, unknown> & {
  id: string;
  channel: string;
  game_slug: string | null;
  signal_type: string;
  payload: JsonValue;
  created_at: string;
};

export type RequestRateLimitRow = Record<string, unknown> & {
  scope: string;
  identifier: string;
  window_started_at: string;
  request_count: number;
  created_at: string;
  updated_at: string;
};

export type XpTransactionRow = Record<string, unknown> & {
  id: string;
  player_id: string;
  game_slug: string;
  round_id: string | null;
  reason: string;
  delta: number;
  event_snapshot: JsonValue;
  metadata: JsonValue;
  created_at: string;
};

export type WheelCategoryRow = Record<string, unknown> & {
  id: string;
  slug: string;
  sort_order: number;
  weight: number;
  title_i18n: JsonValue;
  description_i18n: JsonValue;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WheelTaskRow = Record<string, unknown> & {
  id: string;
  category_id: string;
  task_key: string;
  interaction_type: WheelInteractionType;
  response_mode: WheelResponseMode;
  execution_mode: WheelExecutionMode;
  allow_promise: boolean;
  allow_early_completion: boolean;
  difficulty: WheelDifficulty;
  prompt_i18n: JsonValue;
  details_i18n: JsonValue;
  base_xp: number;
  promise_xp: number;
  skip_penalty_xp: number;
  timeout_penalty_xp: number;
  timer_seconds: number | null;
  feed_safe: boolean;
  requires_other_guest: boolean;
  phone_allowed: boolean;
  public_speaking: boolean;
  physical_contact_level: string;
  couple_centric: boolean;
  is_active: boolean;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
};

export type WheelRoundAssignmentRow = Record<string, unknown> & {
  round_id: string;
  category_id: string;
  task_id: string;
  spin_angle: number;
  cycle_number: number;
  selection_rank: number;
  created_at: string;
};

export type WheelPlayerTaskHistoryRow = Record<string, unknown> & {
  session_id: string;
  player_id: string;
  task_id: string;
  round_id: string;
  cycle_number: number;
  assigned_at: string;
};

export type LeaderboardViewRow = Record<string, unknown> & {
  player_id: string;
  nickname: string | null;
  avatar_key: string;
  total_points: number;
  last_scored_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
};

export type LeaderboardGlobalViewRow = LeaderboardViewRow & {
  score_reached_at: string;
  rank: number;
};

export type LeaderboardGameViewRow = Record<string, unknown> & {
  player_id: string;
  game_slug: string;
  nickname: string | null;
  avatar_key: string;
  total_points: number;
  last_scored_at: string | null;
  onboarding_completed: boolean;
  score_reached_at: string | null;
  rank: number;
};

export type LiveFeedViewRow = Record<string, unknown> & {
  id: string;
  session_id: string | null;
  player_id: string | null;
  game_slug: string;
  round_id: string | null;
  event_type: string;
  visibility: string;
  payload: JsonValue;
  snapshot_name: string | null;
  snapshot_avatar_key: string | null;
  snapshot_prompt_i18n: JsonValue;
  snapshot_answer_text: string | null;
  snapshot_xp_delta: number | null;
  is_hero_event: boolean;
  created_at: string;
};

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

export interface GamesDatabase {
  public: {
    Tables: {
      player_profiles: {
        Row: PlayerProfileRow;
        Insert: {
          id?: string;
          display_name?: string | null;
          display_name_normalized?: string | null;
          avatar_key: string;
          locale?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          display_name_normalized?: string | null;
          avatar_key?: string;
          locale?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: GameSessionRow;
        Insert: {
          id?: string;
          player_id: string;
          game_slug: string;
          status?: string;
          current_cycle?: number;
          total_rounds?: number;
          resolved_rounds?: number;
          last_round_started_at?: string | null;
          last_round_resolved_at?: string | null;
          metadata?: JsonValue;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_slug?: string;
          status?: string;
          current_cycle?: number;
          total_rounds?: number;
          resolved_rounds?: number;
          last_round_started_at?: string | null;
          last_round_resolved_at?: string | null;
          metadata?: JsonValue;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_rounds: {
        Row: GameRoundRow;
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          game_slug: string;
          status: string;
          started_at?: string;
          resolved_at?: string | null;
          resolution?: string | null;
          resolution_reason?: string | null;
          timer_status?: string;
          timer_duration_seconds?: number | null;
          timer_remaining_seconds?: number | null;
          timer_last_started_at?: string | null;
          timer_last_paused_at?: string | null;
          timer_last_sync_at?: string | null;
          response_payload?: JsonValue;
          metadata?: JsonValue;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_id?: string;
          game_slug?: string;
          status?: string;
          started_at?: string;
          resolved_at?: string | null;
          resolution?: string | null;
          resolution_reason?: string | null;
          timer_status?: string;
          timer_duration_seconds?: number | null;
          timer_remaining_seconds?: number | null;
          timer_last_started_at?: string | null;
          timer_last_paused_at?: string | null;
          timer_last_sync_at?: string | null;
          response_payload?: JsonValue;
          metadata?: JsonValue;
        };
        Relationships: [];
      };
      xp_transactions: {
        Row: XpTransactionRow;
        Insert: {
          id?: string;
          player_id: string;
          game_slug: string;
          round_id?: string | null;
          reason: string;
          delta: number;
          event_snapshot?: JsonValue;
          metadata?: JsonValue;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_slug?: string;
          round_id?: string | null;
          reason?: string;
          delta?: number;
          event_snapshot?: JsonValue;
          metadata?: JsonValue;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEventRow;
        Insert: {
          id?: string;
          session_id?: string | null;
          player_id?: string | null;
          game_slug: string;
          round_id?: string | null;
          event_type: string;
          visibility: string;
          payload?: JsonValue;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: JsonValue;
          snapshot_answer_text?: string | null;
          snapshot_xp_delta?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          player_id?: string | null;
          game_slug?: string;
          round_id?: string | null;
          event_type?: string;
          visibility?: string;
          payload?: JsonValue;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: JsonValue;
          snapshot_answer_text?: string | null;
          snapshot_xp_delta?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      realtime_signals: {
        Row: RealtimeSignalRow;
        Insert: {
          id?: string;
          channel: string;
          game_slug?: string | null;
          signal_type: string;
          payload?: JsonValue;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel?: string;
          game_slug?: string | null;
          signal_type?: string;
          payload?: JsonValue;
          created_at?: string;
        };
        Relationships: [];
      };
      request_rate_limits: {
        Row: RequestRateLimitRow;
        Insert: {
          scope: string;
          identifier: string;
          window_started_at: string;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          scope?: string;
          identifier?: string;
          window_started_at?: string;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wheel_categories: {
        Row: WheelCategoryRow;
        Insert: {
          id?: string;
          slug: string;
          sort_order: number;
          weight?: number;
          title_i18n: JsonValue;
          description_i18n: JsonValue;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          sort_order?: number;
          weight?: number;
          title_i18n?: JsonValue;
          description_i18n?: JsonValue;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wheel_tasks: {
        Row: WheelTaskRow;
        Insert: {
          id?: string;
          category_id: string;
          task_key: string;
          interaction_type: WheelInteractionType;
          response_mode: WheelResponseMode;
          execution_mode: WheelExecutionMode;
          allow_promise: boolean;
          allow_early_completion: boolean;
          difficulty: WheelDifficulty;
          prompt_i18n: JsonValue;
          details_i18n?: JsonValue;
          base_xp: number;
          promise_xp: number;
          skip_penalty_xp: number;
          timeout_penalty_xp: number;
          timer_seconds?: number | null;
          feed_safe?: boolean;
          requires_other_guest?: boolean;
          phone_allowed?: boolean;
          public_speaking?: boolean;
          physical_contact_level?: string;
          couple_centric?: boolean;
          is_active?: boolean;
          metadata?: JsonValue;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          task_key?: string;
          interaction_type?: WheelInteractionType;
          response_mode?: WheelResponseMode;
          execution_mode?: WheelExecutionMode;
          allow_promise?: boolean;
          allow_early_completion?: boolean;
          difficulty?: WheelDifficulty;
          prompt_i18n?: JsonValue;
          details_i18n?: JsonValue;
          base_xp?: number;
          promise_xp?: number;
          skip_penalty_xp?: number;
          timeout_penalty_xp?: number;
          timer_seconds?: number | null;
          feed_safe?: boolean;
          requires_other_guest?: boolean;
          phone_allowed?: boolean;
          public_speaking?: boolean;
          physical_contact_level?: string;
          couple_centric?: boolean;
          is_active?: boolean;
          metadata?: JsonValue;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wheel_round_assignments: {
        Row: WheelRoundAssignmentRow;
        Insert: {
          round_id: string;
          category_id: string;
          task_id: string;
          spin_angle: number;
          cycle_number: number;
          selection_rank: number;
          created_at?: string;
        };
        Update: {
          round_id?: string;
          category_id?: string;
          task_id?: string;
          spin_angle?: number;
          cycle_number?: number;
          selection_rank?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      wheel_player_task_history: {
        Row: WheelPlayerTaskHistoryRow;
        Insert: {
          session_id: string;
          player_id: string;
          task_id: string;
          round_id: string;
          cycle_number: number;
          assigned_at?: string;
        };
        Update: {
          session_id?: string;
          player_id?: string;
          task_id?: string;
          round_id?: string;
          cycle_number?: number;
          assigned_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard_global_view: {
        Row: LeaderboardGlobalViewRow;
        Insert: {
          player_id?: string;
          nickname?: string | null;
          avatar_key?: string;
          total_points?: number;
          last_scored_at?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
          score_reached_at?: string;
          rank?: number;
        };
        Update: {
          player_id?: string;
          nickname?: string | null;
          avatar_key?: string;
          total_points?: number;
          last_scored_at?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
          score_reached_at?: string;
          rank?: number;
        };
        Relationships: [];
      };
      leaderboard_game_view: {
        Row: LeaderboardGameViewRow;
        Insert: {
          player_id?: string;
          game_slug?: string;
          nickname?: string | null;
          avatar_key?: string;
          total_points?: number;
          last_scored_at?: string | null;
          onboarding_completed?: boolean;
          score_reached_at?: string | null;
          rank?: number;
        };
        Update: {
          player_id?: string;
          game_slug?: string;
          nickname?: string | null;
          avatar_key?: string;
          total_points?: number;
          last_scored_at?: string | null;
          onboarding_completed?: boolean;
          score_reached_at?: string | null;
          rank?: number;
        };
        Relationships: [];
      };
      leaderboard_view: {
        Row: LeaderboardViewRow;
        Insert: {
          player_id?: string;
          nickname?: string | null;
          avatar_key?: string;
          total_points?: number;
          last_scored_at?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Update: {
          player_id?: string;
          nickname?: string | null;
          avatar_key?: string;
          total_points?: number;
          last_scored_at?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      live_feed_view: {
        Row: LiveFeedViewRow;
        Insert: {
          id?: string;
          session_id?: string | null;
          player_id?: string | null;
          game_slug?: string;
          round_id?: string | null;
          event_type?: string;
          visibility?: string;
          payload?: JsonValue;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: JsonValue;
          snapshot_answer_text?: string | null;
          snapshot_xp_delta?: number | null;
          is_hero_event?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          player_id?: string | null;
          game_slug?: string;
          round_id?: string | null;
          event_type?: string;
          visibility?: string;
          payload?: JsonValue;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: JsonValue;
          snapshot_answer_text?: string | null;
          snapshot_xp_delta?: number | null;
          is_hero_event?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      advance_wheel_session_cycle: {
        Args: {
          p_session_id: string;
          p_current_cycle: number;
        };
        Returns: GameSessionRow[];
      };
      start_wheel_round_atomic: {
        Args: {
          p_session_id: string;
          p_player_id: string;
          p_started_at: string;
          p_category_id: string;
          p_task_id: string;
          p_spin_angle: number;
          p_cycle_number: number;
          p_selection_rank: number;
          p_timer_status: string;
          p_timer_duration_seconds: number | null;
          p_timer_remaining_seconds: number | null;
          p_round_metadata: JsonValue;
          p_activity_payload: JsonValue;
        };
        Returns: string;
      };
      resolve_wheel_round_atomic: {
        Args: {
          p_round_id: string;
          p_player_id: string;
          p_resolved_at: string;
          p_resolution: string;
          p_resolution_reason: string;
          p_timer_status: string;
          p_timer_duration_seconds: number | null;
          p_timer_remaining_seconds: number | null;
          p_timer_last_paused_at: string | null;
          p_timer_last_sync_at: string | null;
          p_response_payload: JsonValue;
          p_round_metadata: JsonValue;
          p_xp_reason: string | null;
          p_xp_delta: number;
          p_xp_event_snapshot: JsonValue;
          p_xp_metadata: JsonValue;
          p_activity_events: JsonValue;
        };
        Returns: string;
      };
      consume_rate_limit_window: {
        Args: {
          p_scope: string;
          p_identifier: string;
          p_limit: number;
          p_window_seconds: number;
          p_now: string;
        };
        Returns: {
          allowed: boolean;
          current_count: number;
          remaining: number;
          retry_after_seconds: number;
          window_started_at: string;
        }[];
      };
    };
  };
}
