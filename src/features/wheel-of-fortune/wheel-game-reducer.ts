import type {
  GameApiErrorCode,
  WheelRoundSnapshot,
} from "@/features/game-session";
import type { RecentResultItem, ResolvedRound } from "./wheel-helpers";

export interface WheelGameState {
  isPreparingRound: boolean;
  isRestoringRound: boolean;
  isSpinning: boolean;
  isStartingTimer: boolean;
  isResolving: boolean;
  activeRound: WheelRoundSnapshot | null;
  resolvedRound: ResolvedRound | null;
  isChallengeOpen: boolean;
  recentResults: RecentResultItem[];
  responseText: string;
  validationMessage: string | null;
  errorCode: GameApiErrorCode | null;
  confettiKey: number;
  showConfetti: boolean;
  pointerLand: boolean;
  timerRemaining: number | null;
}

export type WheelGameAction =
  | { type: "spin_requested" }
  | { type: "spin_cancelled" }
  | { type: "spin_failed"; errorCode: GameApiErrorCode }
  | { type: "spin_preparation_completed" }
  | { type: "spin_round_finalized"; round: WheelRoundSnapshot }
  | { type: "timer_sync"; round?: WheelRoundSnapshot | ResolvedRound | null }
  | { type: "timer_tick"; remainingSeconds: number }
  | { type: "timer_start_requested" }
  | { type: "timer_start_finished" }
  | { type: "timer_started"; round: WheelRoundSnapshot }
  | { type: "timer_start_failed"; errorCode: GameApiErrorCode }
  | { type: "resolve_requested" }
  | { type: "resolve_finished" }
  | {
      type: "round_resolved";
      round: ResolvedRound;
      recentResult: RecentResultItem;
    }
  | { type: "restore_requested" }
  | { type: "round_restored"; round: WheelRoundSnapshot }
  | { type: "restore_failed"; errorCode: GameApiErrorCode }
  | { type: "restore_finished" }
  | { type: "response_text_changed"; value: string }
  | { type: "validation_set"; message: string }
  | { type: "validation_cleared" }
  | { type: "error_set"; errorCode: GameApiErrorCode | null }
  | { type: "pointer_land_cleared" }
  | { type: "confetti_hidden" };

export function getRoundTimerRemaining(
  round?: WheelRoundSnapshot | ResolvedRound | null
): number | null {
  return round?.timer?.remainingSeconds ?? round?.task.timerSeconds ?? null;
}

export function createInitialWheelGameState(): WheelGameState {
  return {
    isPreparingRound: false,
    isRestoringRound: false,
    isSpinning: false,
    isStartingTimer: false,
    isResolving: false,
    activeRound: null,
    resolvedRound: null,
    isChallengeOpen: false,
    recentResults: [],
    responseText: "",
    validationMessage: null,
    errorCode: null,
    confettiKey: 0,
    showConfetti: false,
    pointerLand: false,
    timerRemaining: null,
  };
}

export function wheelGameReducer(
  state: WheelGameState,
  action: WheelGameAction
): WheelGameState {
  switch (action.type) {
    case "spin_requested":
      return {
        ...state,
        isPreparingRound: true,
        isSpinning: true,
        activeRound: null,
        resolvedRound: null,
        isChallengeOpen: false,
        responseText: "",
        validationMessage: null,
        errorCode: null,
        showConfetti: false,
        pointerLand: false,
        timerRemaining: null,
      };
    case "spin_cancelled":
      return {
        ...state,
        isPreparingRound: false,
        isSpinning: false,
      };
    case "spin_failed":
      return {
        ...state,
        isPreparingRound: false,
        isSpinning: false,
        errorCode: action.errorCode,
      };
    case "spin_preparation_completed":
      return {
        ...state,
        isPreparingRound: false,
      };
    case "spin_round_finalized":
      return {
        ...state,
        isSpinning: false,
        pointerLand: true,
        activeRound: action.round,
        isChallengeOpen: true,
        responseText: "",
        validationMessage: null,
        timerRemaining: getRoundTimerRemaining(action.round),
      };
    case "timer_sync":
      return {
        ...state,
        timerRemaining: getRoundTimerRemaining(action.round),
      };
    case "timer_tick":
      return {
        ...state,
        timerRemaining: action.remainingSeconds,
      };
    case "timer_start_requested":
      return {
        ...state,
        isStartingTimer: true,
        validationMessage: null,
        errorCode: null,
      };
    case "timer_started":
      return {
        ...state,
        isStartingTimer: false,
        activeRound: action.round,
        timerRemaining: getRoundTimerRemaining(action.round),
      };
    case "timer_start_finished":
      return {
        ...state,
        isStartingTimer: false,
      };
    case "timer_start_failed":
      return {
        ...state,
        isStartingTimer: false,
        errorCode: action.errorCode,
      };
    case "resolve_requested":
      return {
        ...state,
        isResolving: true,
        validationMessage: null,
        errorCode: null,
      };
    case "resolve_finished":
      return {
        ...state,
        isResolving: false,
      };
    case "round_resolved":
      return {
        ...state,
        isResolving: false,
        activeRound: action.round,
        resolvedRound: action.round,
        isChallengeOpen: false,
        timerRemaining: getRoundTimerRemaining(action.round),
        showConfetti: true,
        confettiKey: state.confettiKey + 1,
        recentResults: [action.recentResult, ...state.recentResults].slice(0, 4),
      };
    case "restore_requested":
      return {
        ...state,
        isRestoringRound: true,
      };
    case "round_restored":
      return {
        ...state,
        activeRound: action.round,
        resolvedRound: null,
        isChallengeOpen: true,
        responseText: "",
        validationMessage: null,
        errorCode: null,
        timerRemaining: getRoundTimerRemaining(action.round),
      };
    case "restore_failed":
      return {
        ...state,
        errorCode: action.errorCode,
      };
    case "restore_finished":
      return {
        ...state,
        isRestoringRound: false,
      };
    case "response_text_changed":
      return {
        ...state,
        responseText: action.value,
        validationMessage: null,
      };
    case "validation_set":
      return {
        ...state,
        validationMessage: action.message,
      };
    case "validation_cleared":
      return {
        ...state,
        validationMessage: null,
      };
    case "error_set":
      return {
        ...state,
        errorCode: action.errorCode,
      };
    case "pointer_land_cleared":
      return {
        ...state,
        pointerLand: false,
      };
    case "confetti_hidden":
      return {
        ...state,
        showConfetti: false,
      };
  }
}
