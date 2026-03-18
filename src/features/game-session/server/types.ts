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

export type GameRoundRow = Record<string, unknown> & {
  id: string;
  player_id: string;
  game_slug: string;
  status: string;
  started_at: string;
  timer_started_at: string | null;
  timer_deadline_at: string | null;
  resolved_at: string | null;
  resolution: string | null;
  response_payload: JsonValue;
  metadata: JsonValue;
};

export type ActivityEventRow = Record<string, unknown> & {
  id: string;
  player_id: string | null;
  game_slug: string;
  round_id: string | null;
  event_type: string;
  visibility: string;
  payload: JsonValue;
  created_at: string;
};

export type XpTransactionRow = Record<string, unknown> & {
  id: string;
  player_id: string;
  game_slug: string;
  round_id: string | null;
  reason: string;
  delta: number;
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
  timer_seconds: number | null;
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
  created_at: string;
};

export type WheelPlayerTaskHistoryRow = Record<string, unknown> & {
  player_id: string;
  task_id: string;
  first_round_id: string;
  created_at: string;
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

export type WheelRoundPayload = Record<string, JsonValue> & {
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
  timerSeconds?: number | null;
  completionXp: number;
  promiseXp: number;
  skipPenaltyXp: number;
  locale: string;
  spinAngle: number;
  timerStartedAt?: string | null;
  timerDeadlineAt?: string | null;
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
      game_rounds: {
        Row: GameRoundRow;
        Insert: {
          id?: string;
          player_id: string;
          game_slug: string;
          status: string;
          started_at?: string;
          timer_started_at?: string | null;
          timer_deadline_at?: string | null;
          resolved_at?: string | null;
          resolution?: string | null;
          response_payload?: JsonValue;
          metadata?: JsonValue;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_slug?: string;
          status?: string;
          started_at?: string;
          timer_started_at?: string | null;
          timer_deadline_at?: string | null;
          resolved_at?: string | null;
          resolution?: string | null;
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
          metadata?: JsonValue;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEventRow;
        Insert: {
          id?: string;
          player_id?: string | null;
          game_slug: string;
          round_id?: string | null;
          event_type: string;
          visibility: string;
          payload?: JsonValue;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string | null;
          game_slug?: string;
          round_id?: string | null;
          event_type?: string;
          visibility?: string;
          payload?: JsonValue;
          created_at?: string;
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
          timer_seconds?: number | null;
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
          timer_seconds?: number | null;
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
          created_at?: string;
        };
        Update: {
          round_id?: string;
          category_id?: string;
          task_id?: string;
          spin_angle?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      wheel_player_task_history: {
        Row: WheelPlayerTaskHistoryRow;
        Insert: {
          player_id: string;
          task_id: string;
          first_round_id: string;
          created_at?: string;
        };
        Update: {
          player_id?: string;
          task_id?: string;
          first_round_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
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
    };
    Functions: Record<string, never>;
  };
}
