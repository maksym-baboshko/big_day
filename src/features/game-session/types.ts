import type {
  WheelDifficulty,
  WheelExecutionMode,
  WheelInteractionType,
  WheelResponseMode,
} from "@/shared/config";

export type GameApiErrorCode =
  | "INVALID_DATA"
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

export type WheelRoundResolution = "completed" | "promised" | "skipped";
export type WheelRoundTimerStatus = "idle" | "running" | "done";

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
  timerSeconds: number | null;
  completionXp: number;
  promiseXp: number;
  skipPenaltyXp: number;
}

export interface WheelRoundTimerSnapshot {
  status: WheelRoundTimerStatus;
  startedAt: string | null;
  deadlineAt: string | null;
  remainingSeconds: number | null;
}

export interface WheelRoundSnapshot {
  roundId: string;
  spinAngle: number;
  category: WheelRoundCategorySnapshot;
  task: WheelRoundTaskSnapshot;
  timer: WheelRoundTimerSnapshot | null;
}

export interface WheelRoundStartApiResponse {
  round: WheelRoundSnapshot;
}

export interface WheelRoundTimerStartApiResponse {
  round: WheelRoundSnapshot;
}

export interface WheelRoundResolveApiResponse {
  player: PlayerSessionSnapshot;
  round: WheelRoundSnapshot & {
    resolution: WheelRoundResolution;
    xpDelta: number;
    responseText: string | null;
  };
}
