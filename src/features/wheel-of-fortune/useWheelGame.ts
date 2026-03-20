"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
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
  // Setters exposed for component animation coordination
  setIsPreparingRound: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSpinning: React.Dispatch<React.SetStateAction<boolean>>;
  setErrorCode: React.Dispatch<React.SetStateAction<GameApiErrorCode | null>>;
  // Spin lifecycle hooks (called by the component around animation)
  beginSpin: () => void;
  setPreparingDone: () => void;
  finalizeSpinRound: (round: WheelRoundSnapshot) => void;
  clearPointerLand: () => void;
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

  const [isPreparingRound, setIsPreparingRound] = useState(false);
  const [isRestoringRound, setIsRestoringRound] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isStartingTimer, setIsStartingTimer] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [activeRound, setActiveRound] = useState<WheelRoundSnapshot | null>(null);
  const [resolvedRound, setResolvedRound] = useState<ResolvedRound | null>(null);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [recentResults, setRecentResults] = useState<RecentResultItem[]>([]);
  const [responseText, setResponseTextRaw] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<GameApiErrorCode | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointerLand, setPointerLand] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

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

  function syncTimerState(round?: WheelRoundSnapshot | null) {
    clearTimerTicker();
    setTimerRemaining(
      round?.timer?.remainingSeconds ?? round?.task.timerSeconds ?? null
    );
  }

  function resetChallengeState(round?: WheelRoundSnapshot | null) {
    setResponseTextRaw("");
    setValidationMessage(null);
    syncTimerState(round);
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
      setErrorCode(await readApiErrorCode(res));
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
        setValidationMessage(t("overlay_text_input_required"));
        setErrorCode(null);
      } else if (
        nextErrorCode === "INVALID_DATA" &&
        round.task.responseMode === "choice"
      ) {
        setValidationMessage(t("overlay_choice_required"));
        setErrorCode(null);
      } else {
        setErrorCode(nextErrorCode);
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
      setErrorCode(await readApiErrorCode(res));
      return null;
    }

    const payload = (await res.json()) as WheelRoundTimerStartApiResponse;
    return payload.round;
  }

  // ── Game actions ───────────────────────────────────────────────────────────
  // Declared before handleTimedOutRound (useEffectEvent) which references handleResolve.

  async function handleBeginTimedTask() {
    if (!activeRound || !isTimerRound || isStartingTimer || isResolving) return;
    setValidationMessage(null);
    setErrorCode(null);
    setIsStartingTimer(true);

    try {
      const round = await startTimerRequest(activeRound);
      if (!round) {
        setIsStartingTimer(false);
        return;
      }
      setActiveRound(round);
      syncTimerState(round);
      setIsStartingTimer(false);
    } catch {
      setErrorCode("PERSISTENCE_ERROR");
      setIsStartingTimer(false);
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
      setValidationMessage(t("overlay_text_input_required"));
      return;
    }

    if (
      resolution === "completed" &&
      activeRound.task.responseMode === "choice" &&
      !activeRound.task.choiceOptions?.includes(normalizedResponseText)
    ) {
      setValidationMessage(t("overlay_choice_required"));
      return;
    }

    if (
      resolution === "completed" &&
      activeRound.task.executionMode === "timed" &&
      timerStatus === "idle"
    ) {
      setValidationMessage(t("overlay_timer_start"));
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

    setValidationMessage(null);
    setErrorCode(null);
    setIsResolving(true);

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
        setIsResolving(false);
        return;
      }

      autoTimedOutRoundRef.current = null;
      onPlayerUpdate(payload.player);
      setResolvedRound(payload.round);
      setActiveRound(payload.round);
      setIsChallengeOpen(false);
      setIsResolving(false);
      syncTimerState(payload.round);
      setShowConfetti(true);
      setConfettiKey((key) => key + 1);
      setRecentResults((prev) =>
        [
          {
            roundId: payload.round.roundId,
            prompt: payload.round.task.prompt,
            categorySlug: payload.round.category.slug,
            categoryTitle: payload.round.category.title,
            resolution: payload.round.resolution,
            xpDelta: payload.round.xpDelta,
          },
          ...prev,
        ].slice(0, 4)
      );

      if (confettiTimeoutRef.current) window.clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = window.setTimeout(() => {
        setShowConfetti(false);
      }, 1000);
    } catch {
      if (
        resolution === "skipped" &&
        isTimerRound &&
        (options?.remainingSeconds ?? timerRemaining ?? 0) === 0
      ) {
        autoTimedOutRoundRef.current = null;
      }
      setErrorCode("PERSISTENCE_ERROR");
      setIsResolving(false);
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
      setTimerRemaining(
        Math.max(0, timerAnchorRef.current.initialRemaining - elapsedSeconds)
      );
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
      if (!cancelled) setIsRestoringRound(true);
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
        setErrorCode(await readApiErrorCode(res));
        return null;
      }

      const payload = (await res.json()) as WheelRoundReadApiResponse;
      return payload.round;
    })()
      .then((round) => {
        if (cancelled || !round) return;
        setResolvedRound(null);
        setActiveRound(round);
        setIsChallengeOpen(true);
        setResponseTextRaw("");
        setValidationMessage(null);
        clearTimerTicker();
        setTimerRemaining(
          round.timer?.remainingSeconds ?? round.task.timerSeconds ?? null
        );
      })
      .catch(() => {
        if (!cancelled) setErrorCode("PERSISTENCE_ERROR");
      })
      .finally(() => {
        if (!cancelled) setIsRestoringRound(false);
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
    setErrorCode(null);
    setResolvedRound(null);
    setActiveRound(null);
    setShowConfetti(false);
    setPointerLand(false);
    resetChallengeState(null);
    setIsPreparingRound(true);
    setIsSpinning(true);
  }

  /**
   * Signals that the server round has arrived and preparation is done.
   * The component continues by starting the spin animation.
   */
  function setPreparingDone() {
    setIsPreparingRound(false);
  }

  /**
   * Called by the component when the spin animation completes.
   * Commits the round to state and opens the challenge overlay.
   */
  function finalizeSpinRound(round: WheelRoundSnapshot) {
    setIsSpinning(false);
    setPointerLand(true);
    setActiveRound(round);
    setIsChallengeOpen(true);
    resetChallengeState(round);
  }

  /** Clears the pointer bounce after its animation. */
  function clearPointerLand() {
    setPointerLand(false);
  }

  function setResponseText(value: string) {
    setResponseTextRaw(value);
    setValidationMessage(null);
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
    // Setters for animation coordination
    setIsPreparingRound,
    setIsSpinning,
    setErrorCode,
    // Spin lifecycle
    beginSpin,
    setPreparingDone,
    finalizeSpinRound,
    clearPointerLand,
    // API actions
    startRoundRequest,
    handleBeginTimedTask,
    handleResolve,
    // Form
    setResponseText,
  };
}
