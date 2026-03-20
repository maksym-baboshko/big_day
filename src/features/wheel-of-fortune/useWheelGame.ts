"use client";

import { useEffect, useEffectEvent, useReducer, useRef } from "react";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/shared/config";
import {
  getGameAuthAccessToken,
  type GameApiErrorCode,
  type PlayerSessionSnapshot,
  type WheelRoundReadApiResponse,
  type WheelRoundResolution,
  type WheelRoundResolveApiResponse,
  type WheelRoundSnapshot,
  type WheelRoundStartApiResponse,
  type WheelRoundTimerStartApiResponse,
} from "@/features/game-session";
import {
  hasMeaningfulGameResponseText,
  normalizeGameResponseText,
} from "@/features/game-session/response-text";
import {
  getCategoryColor,
  getDisplayRound,
  getStatusMessageKey,
  getWheelErrorMessage,
  readApiErrorCode,
  SEGMENT_PALETTE,
  type RecentResultItem,
  type ResolvedRound,
} from "./wheel-helpers";
import {
  createInitialWheelGameState,
  wheelGameReducer,
} from "./wheel-game-reducer";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type WheelTimerStatus = "idle" | "running" | "paused" | "done";

export interface UseWheelGameReturn {
  // Loading flags
  isPreparingRound: boolean;
  isRestoringRound: boolean;
  isSpinning: boolean;
  isStartingTimer: boolean;
  isResolving: boolean;
  // Round state
  activeRound: WheelRoundSnapshot | null;
  resolvedRound: ResolvedRound | null;
  isChallengeOpen: boolean;
  recentResults: RecentResultItem[];
  // Form state
  responseText: string;
  validationMessage: string | null;
  errorCode: GameApiErrorCode | null;
  // Visual feedback
  confettiKey: number;
  showConfetti: boolean;
  pointerLand: boolean;
  timerRemaining: number | null;
  // Derived / computed
  canSpin: boolean;
  displayRound: WheelRoundSnapshot | null;
  wheelError: string | null;
  statusMessageKey: string | null;
  activeColor: string;
  isTimerRound: boolean;
  timerStatus: WheelTimerStatus;
  canFinishTimedRoundEarly: boolean;
  canPromiseActiveRound: boolean;
  // Spin lifecycle hooks (called by the component around animation)
  beginSpin: () => void;
  completeSpinPreparation: () => void;
  finalizeSpinRound: (round: WheelRoundSnapshot) => void;
  clearPointerLand: () => void;
  cancelSpin: () => void;
  failSpin: (errorCode: GameApiErrorCode) => void;
  // API actions
  startRoundRequest: () => Promise<WheelRoundSnapshot | null>;
  handleBeginTimedTask: () => Promise<void>;
  handleResolve: (
    resolution: WheelRoundResolution,
    options?: { remainingSeconds?: number | null }
  ) => Promise<void>;
  // Form helpers
  setResponseText: (value: string) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseWheelGameOptions {
  locale: SupportedLocale;
  onPlayerUpdate: (session: PlayerSessionSnapshot) => void;
}

export function useWheelGame({
  locale,
  onPlayerUpdate,
}: UseWheelGameOptions): UseWheelGameReturn {
  const t = useTranslations("WheelOfFortune");

  // ── State ──────────────────────────────────────────────────────────────────

  const [state, dispatch] = useReducer(
    wheelGameReducer,
    undefined,
    createInitialWheelGameState
  );
  const {
    isPreparingRound,
    isRestoringRound,
    isSpinning,
    isStartingTimer,
    isResolving,
    activeRound,
    resolvedRound,
    isChallengeOpen,
    recentResults,
    responseText,
    validationMessage,
    errorCode,
    confettiKey,
    showConfetti,
    pointerLand,
    timerRemaining,
  } = state;

  // ── Refs ───────────────────────────────────────────────────────────────────

  const confettiTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const timerRemainingRef = useRef<number | null>(null);
  const timerAnchorRef = useRef<{
    startedAtMs: number;
    initialRemaining: number;
  } | null>(null);
  const autoTimedOutRoundRef = useRef<string | null>(null);
  const restoreAttemptedRef = useRef(false);
  /** Cached token so the pagehide handler can fire without async. */
  const accessTokenRef = useRef<string | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────

  const displayRound = getDisplayRound(activeRound, resolvedRound);
  const canSpin =
    !isPreparingRound &&
    !isRestoringRound &&
    !isSpinning &&
    !isResolving &&
    !isChallengeOpen &&
    errorCode !== "NO_TASKS_LEFT";
  const wheelError = getWheelErrorMessage(errorCode, t);
  const statusMessageKey = getStatusMessageKey({
    isPreparingRound: isPreparingRound || isRestoringRound,
    isResolving,
    isSpinning,
  });
  const activeColor = displayRound
    ? getCategoryColor(displayRound.category.slug)
    : SEGMENT_PALETTE[0];
  const isTimerRound = activeRound?.task.executionMode === "timed";
  const timerStatus: WheelTimerStatus = isTimerRound
    ? activeRound?.timer?.status === "running" && (timerRemaining ?? 0) <= 0
      ? "done"
      : (activeRound?.timer?.status ?? "idle")
    : "idle";
  const canFinishTimedRoundEarly =
    Boolean(activeRound?.task.allowEarlyCompletion) && timerStatus === "running";
  const canPromiseActiveRound = activeRound
    ? activeRound.task.allowPromise
    : false;

  // ── Internal helpers ───────────────────────────────────────────────────────
  // Declared before the effects that reference them.

  function clearTimerTicker() {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  function syncTimerState(round?: WheelRoundSnapshot | ResolvedRound | null) {
    clearTimerTicker();
    dispatch({ type: "timer_sync", round });
  }

  // ── API calls ──────────────────────────────────────────────────────────────
  // Declared before effects and game actions that call them.

  async function startRoundRequest(): Promise<WheelRoundSnapshot | null> {
    const accessToken = await getGameAuthAccessToken();
    accessTokenRef.current = accessToken;
    const res = await fetch("/api/games/wheel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ locale }),
    });

    if (!res.ok) {
      dispatch({ type: "error_set", errorCode: await readApiErrorCode(res) });
      return null;
    }

    const payload = (await res.json()) as WheelRoundStartApiResponse;
    return payload.round;
  }

  async function resolveWheelRoundRequest(
    round: WheelRoundSnapshot,
    resolution: WheelRoundResolution
  ): Promise<WheelRoundResolveApiResponse | null> {
    const normalizedResponseText = normalizeGameResponseText(responseText);
    const accessToken = await getGameAuthAccessToken();
    accessTokenRef.current = accessToken;
    const res = await fetch(`/api/games/wheel/${round.roundId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        locale,
        resolution,
        responseText: responseText.trim().length > 0 ? responseText : null,
      }),
    });

    if (!res.ok) {
      const nextErrorCode = await readApiErrorCode(res);
      if (
        nextErrorCode === "INVALID_DATA" &&
        round.task.responseMode === "text_input" &&
        !hasMeaningfulGameResponseText(normalizedResponseText)
      ) {
        dispatch({
          type: "validation_set",
          message: t("overlay_text_input_required"),
        });
        dispatch({ type: "error_set", errorCode: null });
      } else if (
        nextErrorCode === "INVALID_DATA" &&
        round.task.responseMode === "choice"
      ) {
        dispatch({
          type: "validation_set",
          message: t("overlay_choice_required"),
        });
        dispatch({ type: "error_set", errorCode: null });
      } else {
        dispatch({ type: "error_set", errorCode: nextErrorCode });
      }
      return null;
    }

    const payload = (await res.json()) as WheelRoundResolveApiResponse;
    return payload;
  }

  async function startTimerRequest(
    round: WheelRoundSnapshot
  ): Promise<WheelRoundSnapshot | null> {
    const accessToken = await getGameAuthAccessToken();
    accessTokenRef.current = accessToken;
    const res = await fetch(`/api/games/wheel/${round.roundId}/timer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ locale }),
    });

    if (!res.ok) {
      dispatch({ type: "error_set", errorCode: await readApiErrorCode(res) });
      return null;
    }

    const payload = (await res.json()) as WheelRoundTimerStartApiResponse;
    return payload.round;
  }

  // ── Game actions ───────────────────────────────────────────────────────────
  // Declared before handleTimedOutRound (useEffectEvent) which references handleResolve.

  async function handleBeginTimedTask() {
    if (!activeRound || !isTimerRound || isStartingTimer || isResolving) return;
    dispatch({ type: "timer_start_requested" });

    try {
      const round = await startTimerRequest(activeRound);
      if (!round) {
        dispatch({ type: "timer_start_finished" });
        return;
      }
      dispatch({ type: "timer_started", round });
      syncTimerState(round);
    } catch {
      dispatch({ type: "timer_start_failed", errorCode: "PERSISTENCE_ERROR" });
    }
  }

  async function handleResolve(
    resolution: WheelRoundResolution,
    options?: { remainingSeconds?: number | null }
  ) {
    if (!activeRound || isResolving || isStartingTimer) return;

    const normalizedResponseText = normalizeGameResponseText(responseText) ?? "";

    if (
      resolution === "completed" &&
      activeRound.task.responseMode === "text_input" &&
      !hasMeaningfulGameResponseText(normalizedResponseText)
    ) {
      dispatch({
        type: "validation_set",
        message: t("overlay_text_input_required"),
      });
      return;
    }

    if (
      resolution === "completed" &&
      activeRound.task.responseMode === "choice" &&
      !activeRound.task.choiceOptions?.includes(normalizedResponseText)
    ) {
      dispatch({
        type: "validation_set",
        message: t("overlay_choice_required"),
      });
      return;
    }

    if (
      resolution === "completed" &&
      activeRound.task.executionMode === "timed" &&
      timerStatus === "idle"
    ) {
      dispatch({
        type: "validation_set",
        message: t("overlay_timer_start"),
      });
      return;
    }

    if (
      resolution === "completed" &&
      activeRound.task.executionMode === "timed" &&
      timerStatus === "running" &&
      !activeRound.task.allowEarlyCompletion
    ) {
      return;
    }

    dispatch({ type: "resolve_requested" });

    try {
      const payload = await resolveWheelRoundRequest(activeRound, resolution);

      if (!payload) {
        if (
          resolution === "skipped" &&
          isTimerRound &&
          (options?.remainingSeconds ?? timerRemaining ?? 0) === 0
        ) {
          autoTimedOutRoundRef.current = null;
        }
        dispatch({ type: "resolve_finished" });
        return;
      }

      autoTimedOutRoundRef.current = null;
      onPlayerUpdate(payload.player);
      dispatch({
        type: "round_resolved",
        round: payload.round,
        recentResult: {
          roundId: payload.round.roundId,
          prompt: payload.round.task.prompt,
          categorySlug: payload.round.category.slug,
          categoryTitle: payload.round.category.title,
          resolution: payload.round.resolution,
          xpDelta: payload.round.xpDelta,
        },
      });
      syncTimerState(payload.round);

      if (confettiTimeoutRef.current) window.clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = window.setTimeout(() => {
        dispatch({ type: "confetti_hidden" });
      }, 1000);
    } catch {
      if (
        resolution === "skipped" &&
        isTimerRound &&
        (options?.remainingSeconds ?? timerRemaining ?? 0) === 0
      ) {
        autoTimedOutRoundRef.current = null;
      }
      dispatch({ type: "error_set", errorCode: "PERSISTENCE_ERROR" });
      dispatch({ type: "resolve_finished" });
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  // Keep timerRemainingRef in sync for use inside callbacks
  useEffect(() => {
    timerRemainingRef.current = timerRemaining;
  }, [timerRemaining]);

  // Cleanup timer and confetti on unmount
  useEffect(
    () => () => {
      if (confettiTimeoutRef.current) window.clearTimeout(confettiTimeoutRef.current);
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    },
    []
  );

  // Prime the cached access token so pagehide can fire synchronously
  useEffect(() => {
    let cancelled = false;
    void getGameAuthAccessToken()
      .then((token) => {
        if (!cancelled) accessTokenRef.current = token;
      })
      .catch(() => {
        accessTokenRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset round-restore flag when the locale changes so we re-check for open rounds
  useEffect(() => {
    restoreAttemptedRef.current = false;
  }, [locale]);

  // Client-side countdown tick
  useEffect(() => {
    if (!isChallengeOpen || activeRound?.task.executionMode !== "timed") {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      timerAnchorRef.current = null;
      return;
    }

    const initialRemaining =
      activeRound.timer?.remainingSeconds ?? activeRound.task.timerSeconds;

    if (timerStatus !== "running" || initialRemaining == null) {
      timerAnchorRef.current = null;
      return;
    }

    timerAnchorRef.current = {
      startedAtMs: Date.now(),
      initialRemaining,
    };

    const tick = () => {
      if (!timerAnchorRef.current) return;
      const elapsedSeconds = Math.floor(
        (Date.now() - timerAnchorRef.current.startedAtMs) / 1000
      );
      dispatch({
        type: "timer_tick",
        remainingSeconds: Math.max(
          0,
          timerAnchorRef.current.initialRemaining - elapsedSeconds
        ),
      });
    };

    tick();
    timerIntervalRef.current = window.setInterval(tick, 250);

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      timerAnchorRef.current = null;
    };
  }, [
    activeRound?.roundId,
    activeRound?.task.executionMode,
    activeRound?.task.timerSeconds,
    activeRound?.timer?.remainingSeconds,
    isChallengeOpen,
    timerStatus,
  ]);

  // Pause the timer when the player navigates away mid-task
  useEffect(() => {
    if (
      !activeRound ||
      activeRound.task.executionMode !== "timed" ||
      timerStatus !== "running"
    ) {
      return;
    }

    const handlePageHide = () => {
      const accessToken = accessTokenRef.current;
      if (!accessToken) return;

      void fetch(`/api/games/wheel/${activeRound.roundId}/timer/pause`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ locale }),
      }).catch(() => {});
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [activeRound, locale, timerStatus]);

  // Restore an open round from the server on initial mount / locale change
  useEffect(() => {
    if (restoreAttemptedRef.current || activeRound || resolvedRound) return;

    let cancelled = false;
    restoreAttemptedRef.current = true;
    queueMicrotask(() => {
      if (!cancelled) dispatch({ type: "restore_requested" });
    });

    void (async () => {
      const accessToken = await getGameAuthAccessToken();
      accessTokenRef.current = accessToken;
      const res = await fetch(
        `/api/games/wheel?locale=${encodeURIComponent(locale)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) {
        dispatch({
          type: "restore_failed",
          errorCode: await readApiErrorCode(res),
        });
        return null;
      }

      const payload = (await res.json()) as WheelRoundReadApiResponse;
      return payload.round;
    })()
      .then((round) => {
        if (cancelled || !round) return;
        dispatch({ type: "round_restored", round });
        clearTimerTicker();
        dispatch({ type: "timer_sync", round });
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: "restore_failed", errorCode: "PERSISTENCE_ERROR" });
        }
      })
      .finally(() => {
        if (!cancelled) dispatch({ type: "restore_finished" });
      });

    return () => {
      cancelled = true;
    };
  }, [activeRound, locale, resolvedRound]);

  // Auto-resolve timed rounds whose countdown has hit zero.
  // useEffectEvent reads the latest handleResolve without adding it to deps.
  const handleTimedOutRound = useEffectEvent(() => {
    void handleResolve("skipped", { remainingSeconds: 0 });
  });

  useEffect(() => {
    if (
      !activeRound ||
      !isChallengeOpen ||
      activeRound.task.executionMode !== "timed"
    ) {
      autoTimedOutRoundRef.current = null;
      return;
    }

    if (
      timerStatus === "done" &&
      !isResolving &&
      autoTimedOutRoundRef.current !== activeRound.roundId
    ) {
      autoTimedOutRoundRef.current = activeRound.roundId;
      queueMicrotask(() => {
        handleTimedOutRound();
      });
    }
  }, [activeRound, isChallengeOpen, isResolving, timerStatus]);

  // ── Spin lifecycle (called by the component around animation) ──────────────

  /** Resets all stale state and marks the wheel as preparing + spinning. */
  function beginSpin() {
    clearTimerTicker();
    dispatch({ type: "spin_requested" });
  }

  /**
   * Signals that the server round has arrived and preparation is done.
   * The component continues by starting the spin animation.
   */
  function completeSpinPreparation() {
    dispatch({ type: "spin_preparation_completed" });
  }

  /**
   * Called by the component when the spin animation completes.
   * Commits the round to state and opens the challenge overlay.
   */
  function finalizeSpinRound(round: WheelRoundSnapshot) {
    dispatch({ type: "spin_round_finalized", round });
  }

  /** Clears the pointer bounce after its animation. */
  function clearPointerLand() {
    dispatch({ type: "pointer_land_cleared" });
  }

  function cancelSpin() {
    dispatch({ type: "spin_cancelled" });
  }

  function failSpin(errorCode: GameApiErrorCode) {
    dispatch({ type: "spin_failed", errorCode });
  }

  function setResponseText(value: string) {
    dispatch({ type: "response_text_changed", value });
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    isPreparingRound,
    isRestoringRound,
    isSpinning,
    isStartingTimer,
    isResolving,
    activeRound,
    resolvedRound,
    isChallengeOpen,
    recentResults,
    responseText,
    validationMessage,
    errorCode,
    confettiKey,
    showConfetti,
    pointerLand,
    timerRemaining,
    // Derived
    canSpin,
    displayRound,
    wheelError,
    statusMessageKey,
    activeColor,
    isTimerRound,
    timerStatus,
    canFinishTimedRoundEarly,
    canPromiseActiveRound,
    // Spin lifecycle
    beginSpin,
    completeSpinPreparation,
    finalizeSpinRound,
    clearPointerLand,
    cancelSpin,
    failSpin,
    // API actions
    startRoundRequest,
    handleBeginTimedTask,
    handleResolve,
    // Form
    setResponseText,
  };
}
