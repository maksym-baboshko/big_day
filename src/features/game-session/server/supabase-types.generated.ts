/**
 * Generated from the repo-local Supabase schema surface.
 *
 * Regenerate with:
 * `pnpm supabase:types:generate -- --local`
 * or
 * `pnpm supabase:types:generate -- --linked`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PlayerProfilesRow = {
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

type GameDefinitionsRow = {
  slug: string;
  status: string;
  sort_order: number;
  live_enabled: boolean;
  title_i18n: Json;
  description_i18n: Json;
  created_at: string;
  updated_at: string;
};

type GameSessionsRow = {
  id: string;
  player_id: string;
  game_slug: string;
  status: string;
  current_cycle: number;
  total_rounds: number;
  resolved_rounds: number;
  last_round_started_at: string | null;
  last_round_resolved_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

type GameRoundsRow = {
  id: string;
  session_id: string | null;
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
  timer_started_at: string | null;
  timer_deadline_at: string | null;
  response_payload: Json;
  metadata: Json;
};

type XpTransactionsRow = {
  id: string;
  player_id: string;
  game_slug: string;
  round_id: string | null;
  reason: string;
  delta: number;
  event_snapshot: Json;
  metadata: Json;
  created_at: string;
};

type ActivityEventsRow = {
  id: string;
  session_id: string | null;
  player_id: string | null;
  game_slug: string;
  round_id: string | null;
  event_type: string;
  visibility: string;
  payload: Json;
  snapshot_name: string | null;
  snapshot_avatar_key: string | null;
  snapshot_prompt_i18n: Json;
  snapshot_answer_text: string | null;
  snapshot_xp_delta: number | null;
  created_at: string;
};

type RealtimeSignalsRow = {
  id: string;
  channel: string;
  game_slug: string | null;
  signal_type: string;
  payload: Json;
  created_at: string;
};

type RequestRateLimitsRow = {
  scope: string;
  identifier: string;
  window_started_at: string;
  request_count: number;
  created_at: string;
  updated_at: string;
};

type WheelCategoriesRow = {
  id: string;
  slug: string;
  sort_order: number;
  weight: number;
  title_i18n: Json;
  description_i18n: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type WheelTasksRow = {
  id: string;
  category_id: string;
  task_key: string;
  interaction_type: string;
  response_mode: string;
  execution_mode: string;
  allow_promise: boolean;
  allow_early_completion: boolean;
  difficulty: string;
  prompt_i18n: Json;
  details_i18n: Json;
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
  metadata: Json;
  created_at: string;
  updated_at: string;
};

type WheelRoundAssignmentsRow = {
  round_id: string;
  category_id: string;
  task_id: string;
  spin_angle: number;
  cycle_number: number;
  selection_rank: number;
  created_at: string;
};

type WheelPlayerTaskHistoryRow = {
  session_id: string;
  player_id: string;
  task_id: string;
  first_round_id: string | null;
  round_id: string;
  cycle_number: number;
  assigned_at: string;
  created_at: string;
};

type LeaderboardGlobalViewRow = {
  player_id: string;
  nickname: string | null;
  avatar_key: string;
  total_points: number;
  last_scored_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  score_reached_at: string;
  rank: number;
};

type LeaderboardGameViewRow = {
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

type LiveFeedViewRow = {
  id: string;
  session_id: string | null;
  player_id: string | null;
  game_slug: string;
  round_id: string | null;
  event_type: string;
  visibility: string;
  payload: Json;
  snapshot_name: string | null;
  snapshot_avatar_key: string | null;
  snapshot_prompt_i18n: Json;
  snapshot_answer_text: string | null;
  snapshot_xp_delta: number | null;
  is_hero_event: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      player_profiles: {
        Row: PlayerProfilesRow;
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
      game_definitions: {
        Row: GameDefinitionsRow;
        Insert: {
          slug: string;
          status: string;
          sort_order: number;
          live_enabled?: boolean;
          title_i18n: Json;
          description_i18n: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          status?: string;
          sort_order?: number;
          live_enabled?: boolean;
          title_i18n?: Json;
          description_i18n?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: GameSessionsRow;
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
          metadata?: Json;
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
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_rounds: {
        Row: GameRoundsRow;
        Insert: {
          id?: string;
          session_id?: string | null;
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
          timer_started_at?: string | null;
          timer_deadline_at?: string | null;
          response_payload?: Json;
          metadata?: Json;
        };
        Update: {
          id?: string;
          session_id?: string | null;
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
          timer_started_at?: string | null;
          timer_deadline_at?: string | null;
          response_payload?: Json;
          metadata?: Json;
        };
        Relationships: [];
      };
      xp_transactions: {
        Row: XpTransactionsRow;
        Insert: {
          id?: string;
          player_id: string;
          game_slug: string;
          round_id?: string | null;
          reason: string;
          delta: number;
          event_snapshot?: Json;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_slug?: string;
          round_id?: string | null;
          reason?: string;
          delta?: number;
          event_snapshot?: Json;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEventsRow;
        Insert: {
          id?: string;
          session_id?: string | null;
          player_id?: string | null;
          game_slug: string;
          round_id?: string | null;
          event_type: string;
          visibility: string;
          payload?: Json;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: Json;
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
          payload?: Json;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: Json;
          snapshot_answer_text?: string | null;
          snapshot_xp_delta?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      realtime_signals: {
        Row: RealtimeSignalsRow;
        Insert: {
          id?: string;
          channel: string;
          game_slug?: string | null;
          signal_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel?: string;
          game_slug?: string | null;
          signal_type?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      request_rate_limits: {
        Row: RequestRateLimitsRow;
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
        Row: WheelCategoriesRow;
        Insert: {
          id?: string;
          slug: string;
          sort_order: number;
          weight?: number;
          title_i18n: Json;
          description_i18n: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          sort_order?: number;
          weight?: number;
          title_i18n?: Json;
          description_i18n?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wheel_tasks: {
        Row: WheelTasksRow;
        Insert: {
          id?: string;
          category_id: string;
          task_key: string;
          interaction_type: string;
          response_mode: string;
          execution_mode: string;
          allow_promise?: boolean;
          allow_early_completion?: boolean;
          difficulty: string;
          prompt_i18n: Json;
          details_i18n?: Json;
          base_xp: number;
          promise_xp: number;
          skip_penalty_xp: number;
          timeout_penalty_xp?: number;
          timer_seconds?: number | null;
          feed_safe?: boolean;
          requires_other_guest?: boolean;
          phone_allowed?: boolean;
          public_speaking?: boolean;
          physical_contact_level?: string;
          couple_centric?: boolean;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          task_key?: string;
          interaction_type?: string;
          response_mode?: string;
          execution_mode?: string;
          allow_promise?: boolean;
          allow_early_completion?: boolean;
          difficulty?: string;
          prompt_i18n?: Json;
          details_i18n?: Json;
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
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wheel_round_assignments: {
        Row: WheelRoundAssignmentsRow;
        Insert: {
          round_id: string;
          category_id: string;
          task_id: string;
          spin_angle: number;
          cycle_number?: number;
          selection_rank?: number;
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
          first_round_id?: string | null;
          round_id: string;
          cycle_number?: number;
          assigned_at?: string;
          created_at?: string;
        };
        Update: {
          session_id?: string;
          player_id?: string;
          task_id?: string;
          first_round_id?: string | null;
          round_id?: string;
          cycle_number?: number;
          assigned_at?: string;
          created_at?: string;
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
        Row: Omit<LeaderboardGlobalViewRow, "score_reached_at" | "rank">;
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
          payload?: Json;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: Json;
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
          payload?: Json;
          snapshot_name?: string | null;
          snapshot_avatar_key?: string | null;
          snapshot_prompt_i18n?: Json;
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
        Returns: GameSessionsRow[];
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
          rate_limit_window_started_at: string;
        }[];
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
          p_round_metadata: Json;
          p_activity_payload: Json;
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
          p_response_payload: Json;
          p_round_metadata: Json;
          p_xp_reason: string | null;
          p_xp_delta: number;
          p_xp_event_snapshot: Json;
          p_xp_metadata: Json;
          p_activity_events: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];

export type Views<ViewName extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][ViewName]["Row"];

export type Functions<FunctionName extends keyof PublicSchema["Functions"]> =
  PublicSchema["Functions"][FunctionName]["Returns"];
