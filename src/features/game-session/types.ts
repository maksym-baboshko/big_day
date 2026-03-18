import type {
  GameSlug,
  SupportedLocale,
  WheelDifficulty,
  WheelExecutionMode,
  WheelInteractionType,
  WheelResponseMode,
} from "@/shared/config";

export type GameApiErrorCode =
  | "INVALID_DATA"
  | "RATE_LIMITED"
  | "PLAYER_NOT_FOUND"
  | "NO_TASKS_LEFT"
  | "ROUND_NOT_FOUND"
  | "ROUND_ALREADY_RESOLVED"
  | "UNAUTHORIZED"
  | "SUPABASE_NOT_CONFIGURED"
  | "PERSISTENCE_ERROR";

export interface PlayerSessionSnapshot {
  playerId: string;
  nickname: string;
  avatarKey: string;
  totalPoints: number;
}

export interface PlayerApiResponse {
  player: PlayerSessionSnapshot | null;
}

export interface LeaderboardEntrySnapshot {
  playerId: string;
  nickname: string;
  avatarKey: string;
  totalPoints: number;
  rank: number;
}

export interface GameLeaderboardSnapshot {
  gameSlug: GameSlug;
  currentPlayerId: string;
  top: LeaderboardEntrySnapshot[];
  playerEntry: LeaderboardEntrySnapshot | null;
  playerWindow: LeaderboardEntrySnapshot[];
}

export interface GameLeaderboardApiResponse {
  leaderboard: GameLeaderboardSnapshot;
}

export type LiveFeedEventType =
  | "player.joined"
  | "xp.awarded"
  | "wheel.round.completed"
  | "wheel.round.promised"
  | "leaderboard.new_top_player";

export interface LocalizedTextSnapshot {
  uk: string | null;
  en: string | null;
}

export interface LiveFeedEventSnapshot {
  id: string;
  gameSlug: GameSlug;
  eventType: LiveFeedEventType;
  locale: SupportedLocale | null;
  playerId: string | null;
  playerName: string | null;
  avatarKey: string | null;
  promptI18n: LocalizedTextSnapshot;
  answerText: string | null;
  xpDelta: number | null;
  welcomeText: string | null;
  isHeroEvent: boolean;
  createdAt: string;
}

export interface LivePageApiResponse {
  leaderboard: LeaderboardEntrySnapshot[];
  feed: LiveFeedEventSnapshot[];
}

export type WheelRoundResolution = "completed" | "promised" | "skipped";
export type WheelRoundResolutionReason =
  | "not_applicable"
  | "manual_skip"
  | "timed_out";
export type WheelRoundTimerStatus = "idle" | "running" | "paused" | "done";

export interface WheelRoundCategorySnapshot {
  slug: string;
  title: string;
  description: string;
}

export interface WheelRoundTaskSnapshot {
  taskKey: string;
  interactionType: WheelInteractionType;
  responseMode: WheelResponseMode;
  executionMode: WheelExecutionMode;
  allowPromise: boolean;
  allowEarlyCompletion: boolean;
  difficulty: WheelDifficulty;
  prompt: string;
  details: string | null;
  choiceOptions: string[] | null;
  timerSeconds: number | null;
  completionXp: number;
  promiseXp: number;
  skipPenaltyXp: number;
  timeoutPenaltyXp: number;
}

export interface WheelRoundTimerSnapshot {
  status: WheelRoundTimerStatus;
  durationSeconds: number | null;
  startedAt: string | null;
  pausedAt: string | null;
  remainingSeconds: number | null;
}

export interface WheelRoundSnapshot {
  roundId: string;
  sessionId: string;
  cycleNumber: number;
  selectionRank: number;
  spinAngle: number;
  category: WheelRoundCategorySnapshot;
  task: WheelRoundTaskSnapshot;
  timer: WheelRoundTimerSnapshot | null;
}

export interface WheelRoundReadApiResponse {
  round: WheelRoundSnapshot | null;
}

export interface WheelRoundStartApiResponse {
  round: WheelRoundSnapshot;
}

export interface WheelRoundTimerStartApiResponse {
  round: WheelRoundSnapshot;
}

export interface WheelRoundTimerPauseApiResponse {
  round: WheelRoundSnapshot;
}

export interface WheelRoundResolveApiResponse {
  player: PlayerSessionSnapshot;
  round: WheelRoundSnapshot & {
    resolution: WheelRoundResolution;
    resolutionReason: WheelRoundResolutionReason;
    xpDelta: number;
    responseText: string | null;
  };
}
