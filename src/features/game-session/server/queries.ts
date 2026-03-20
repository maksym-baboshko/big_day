export const WHEEL_GAME_SLUG = "wheel-of-fortune";

export const LEADERBOARD_GLOBAL_SELECT =
  "player_id, nickname, avatar_key, total_points, last_scored_at, onboarding_completed, created_at, updated_at, last_seen_at, score_reached_at, rank";
export const LEADERBOARD_GAME_SELECT =
  "player_id, game_slug, nickname, avatar_key, total_points, last_scored_at, onboarding_completed, score_reached_at, rank";
export const PLAYER_PROFILE_SELECT =
  "id, display_name, display_name_normalized, avatar_key, locale, onboarding_completed, created_at, updated_at, last_seen_at";
export const GAME_SESSION_SELECT =
  "id, player_id, game_slug, status, current_cycle, total_rounds, resolved_rounds, last_round_started_at, last_round_resolved_at, metadata, created_at, updated_at";
export const GAME_ROUND_SELECT =
  "id, session_id, player_id, game_slug, status, started_at, resolved_at, resolution, resolution_reason, timer_status, timer_duration_seconds, timer_remaining_seconds, timer_last_started_at, timer_last_paused_at, timer_last_sync_at, response_payload, metadata";
export const WHEEL_CATEGORY_SELECT =
  "id, slug, sort_order, weight, title_i18n, description_i18n, is_active, created_at, updated_at";
export const WHEEL_TASK_SELECT =
  "id, category_id, task_key, interaction_type, response_mode, execution_mode, allow_promise, allow_early_completion, difficulty, prompt_i18n, details_i18n, base_xp, promise_xp, skip_penalty_xp, timeout_penalty_xp, timer_seconds, feed_safe, requires_other_guest, phone_allowed, public_speaking, physical_contact_level, couple_centric, is_active, metadata, created_at, updated_at";
export const WHEEL_ASSIGNMENT_SELECT =
  "round_id, category_id, task_id, spin_angle, cycle_number, selection_rank, created_at";
export const LIVE_FEED_SELECT =
  "id, session_id, player_id, game_slug, round_id, event_type, visibility, payload, snapshot_name, snapshot_avatar_key, snapshot_prompt_i18n, snapshot_answer_text, snapshot_xp_delta, is_hero_event, created_at";
