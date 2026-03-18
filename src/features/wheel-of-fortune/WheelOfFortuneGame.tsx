"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
} from "framer-motion";
import {
  WHEEL_CONTENT_CATEGORIES,
  type SupportedLocale,
  type WheelInteractionType,
} from "@/shared/config";
import {
  getGameAuthAccessToken,
  type GameApiErrorCode,
  type PlayerSessionSnapshot,
  type WheelRoundResolution,
  type WheelRoundResolveApiResponse,
  type WheelRoundSnapshot,
  type WheelRoundStartApiResponse,
  type WheelRoundTimerStartApiResponse,
} from "@/features/game-session";
import { cn } from "@/shared/lib";

const wheelEase = [0.22, 1, 0.36, 1] as const;
const wheelDurationSeconds = 4.6;

// Two-tone Art Deco palette: champagne gold ↔ deep bronze
const SEGMENT_PALETTE = ["#caa76a", "#5c3e22"] as const;

type ResolvedRound = WheelRoundResolveApiResponse["round"];

interface RecentResultItem {
  roundId: string;
  prompt: string;
  categorySlug: string;
  categoryTitle: string;
  resolution: WheelRoundResolution;
  xpDelta: number;
}

interface WheelOfFortuneGameProps {
  onPlayerUpdate: (session: PlayerSessionSnapshot) => void;
}

function polarToCartesian(radius: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

function describeSlice(startAngle: number, endAngle: number) {
  const s = polarToCartesian(48.5, endAngle);
  const e = polarToCartesian(48.5, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M 50 50 L ${s.x} ${s.y} A 48.5 48.5 0 ${large} 0 ${e.x} ${e.y} Z`;
}

function buildWheelRotation(
  currentRotation: number,
  selectedIndex: number,
  segmentAngle: number
) {
  const norm = ((currentRotation % 360) + 360) % 360;
  const target = selectedIndex * segmentAngle + segmentAngle / 2;
  const delta = (360 - target - norm + 360) % 360;
  return currentRotation + 5 * 360 + delta;
}

async function readApiErrorCode(res: Response): Promise<GameApiErrorCode> {
  try {
    const payload = (await res.json()) as { code?: GameApiErrorCode };
    return payload.code ?? "PERSISTENCE_ERROR";
  } catch {
    return "PERSISTENCE_ERROR";
  }
}

function ConfettiPop({ trigger }: { trigger: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = 60 + ((trigger + i * 17) % 40);
        return (
          <motion.div
            key={`${trigger}-${i}`}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.2, 0.6],
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute h-2 w-2 rounded-full"
            style={{
              background: SEGMENT_PALETTE[i % SEGMENT_PALETTE.length],
            }}
          />
        );
      })}
    </div>
  );
}

function getCategoryIndex(categorySlug: string) {
  return WHEEL_CONTENT_CATEGORIES.findIndex(
    (category) => category.slug === categorySlug
  );
}

function getCategoryColor(categorySlug: string) {
  const categoryIndex = getCategoryIndex(categorySlug);
  return SEGMENT_PALETTE[
    (categoryIndex >= 0 ? categoryIndex : 0) % SEGMENT_PALETTE.length
  ];
}

function getInteractionLabelKey(interactionType: WheelInteractionType) {
  switch (interactionType) {
    case "confirm":
      return "interaction_confirm";
    case "text_input":
      return "interaction_text_input";
    case "timer":
      return "interaction_timer";
    case "async_task":
      return "interaction_async_task";
  }
}

function getResolutionKey(resolution: WheelRoundResolution) {
  switch (resolution) {
    case "completed":
      return "resolution_completed";
    case "promised":
      return "resolution_promised";
    case "skipped":
      return "resolution_skipped";
  }
}

function getStatusMessageKey({
  isPreparingRound,
  isResolving,
  isSpinning,
}: {
  isPreparingRound: boolean;
  isResolving: boolean;
  isSpinning: boolean;
}) {
  if (isPreparingRound) {
    return "preparing_round";
  }

  if (isResolving) {
    return "saving_result";
  }

  if (isSpinning) {
    return "spinning_cta";
  }

  return null;
}

function getWheelErrorMessage(
  errorCode: GameApiErrorCode | null,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  switch (errorCode) {
    case "SUPABASE_NOT_CONFIGURED":
      return t("errors.storage_unavailable");
    case "NO_TASKS_LEFT":
      return t("errors.no_tasks_left");
    case "PLAYER_NOT_FOUND":
    case "UNAUTHORIZED":
      return t("errors.session_required");
    case "ROUND_ALREADY_RESOLVED":
    case "ROUND_NOT_FOUND":
    case "INVALID_DATA":
    case "PERSISTENCE_ERROR":
      return t("errors.generic");
    default:
      return null;
  }
}

function getDisplayRound(
  activeRound: WheelRoundSnapshot | null,
  resolvedRound: ResolvedRound | null
) {
  return resolvedRound ?? activeRound;
}

export function WheelOfFortuneGame({
  onPlayerUpdate,
}: WheelOfFortuneGameProps) {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("WheelOfFortune");
  const tCommon = useTranslations("GamesCommon");

  const rotation = useMotionValue(0);
  const [isPreparingRound, setIsPreparingRound] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isStartingTimer, setIsStartingTimer] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [activeRound, setActiveRound] = useState<WheelRoundSnapshot | null>(null);
  const [resolvedRound, setResolvedRound] = useState<ResolvedRound | null>(null);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [recentResults, setRecentResults] = useState<RecentResultItem[]>([]);
  const [responseText, setResponseText] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<GameApiErrorCode | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointerLand, setPointerLand] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  const spinTimeoutRef = useRef<number | null>(null);
  const confettiTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const spinAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const idleAnimationRef = useRef<AnimationPlaybackControls | null>(null);

  const segmentAngle = 360 / WHEEL_CONTENT_CATEGORIES.length;
  const displayRound = getDisplayRound(activeRound, resolvedRound);
  const canSpin =
    !isPreparingRound &&
    !isSpinning &&
    !isResolving &&
    !isChallengeOpen &&
    errorCode !== "NO_TASKS_LEFT";
  const wheelError = getWheelErrorMessage(errorCode, t);
  const statusMessageKey = getStatusMessageKey({
    isPreparingRound,
    isResolving,
    isSpinning,
  });
  const activeColor = displayRound
    ? getCategoryColor(displayRound.category.slug)
    : SEGMENT_PALETTE[0];
  const isTimerRound = activeRound?.task.executionMode === "timed";
  const timerStatus = isTimerRound
    ? activeRound?.timer?.status === "running" && (timerRemaining ?? 0) <= 0
      ? "done"
      : activeRound?.timer?.status ?? "idle"
    : "idle";
  const canFinishTimedRoundEarly =
    Boolean(activeRound?.task.allowEarlyCompletion) && timerStatus === "running";
  const canPromiseActiveRound = activeRound
    ? activeRound.task.allowPromise
    : false;

  useEffect(
    () => () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
      }
      if (confettiTimeoutRef.current) {
        window.clearTimeout(confettiTimeoutRef.current);
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (spinAnimationRef.current) {
        spinAnimationRef.current.stop();
      }
      if (idleAnimationRef.current) {
        idleAnimationRef.current.stop();
      }
    },
    []
  );

  // Idle slow rotation — plays whenever the wheel is at rest
  useEffect(() => {
    if (!isSpinning && !isPreparingRound) {
      idleAnimationRef.current = animate(rotation, rotation.get() + 360, {
        duration: 22,
        ease: "linear",
        repeat: Infinity,
      });
    } else {
      idleAnimationRef.current?.stop();
      idleAnimationRef.current = null;
    }
    return () => {
      idleAnimationRef.current?.stop();
    };
  }, [isSpinning, isPreparingRound]);

  useEffect(() => {
    if (!isChallengeOpen || activeRound?.task.executionMode !== "timed") {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    const deadlineAt = activeRound.timer?.deadlineAt;

    if (timerStatus !== "running" || !deadlineAt) {
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1000)
      );
      setTimerRemaining(remaining);
    };

    tick();
    timerIntervalRef.current = window.setInterval(tick, 250);

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [
    activeRound?.roundId,
    activeRound?.task.executionMode,
    activeRound?.timer?.deadlineAt,
    isChallengeOpen,
    timerStatus,
  ]);

  function clearTimerTicker() {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  function syncTimerState(round?: WheelRoundSnapshot | null) {
    clearTimerTicker();
    setTimerRemaining(round?.timer?.remainingSeconds ?? round?.task.timerSeconds ?? null);
  }

  function resetChallengeState(round?: WheelRoundSnapshot | null) {
    setResponseText("");
    setValidationMessage(null);
    syncTimerState(round);
  }

  async function startWheelRoundRequest() {
    const accessToken = await getGameAuthAccessToken();
    const res = await fetch("/api/games/wheel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        locale,
      }),
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
  ) {
    const accessToken = await getGameAuthAccessToken();
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
      setErrorCode(nextErrorCode);

      if (
        nextErrorCode === "INVALID_DATA" &&
        round.task.responseMode === "text_input" &&
        responseText.trim().length === 0
      ) {
        setValidationMessage(t("overlay_text_input_required"));
      }

      return null;
    }

    const payload = (await res.json()) as WheelRoundResolveApiResponse;
    return payload;
  }

  async function startWheelTimerRequest(round: WheelRoundSnapshot) {
    const accessToken = await getGameAuthAccessToken();
    const res = await fetch(`/api/games/wheel/${round.roundId}/timer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        locale,
      }),
    });

    if (!res.ok) {
      setErrorCode(await readApiErrorCode(res));
      return null;
    }

    const payload = (await res.json()) as WheelRoundTimerStartApiResponse;
    return payload.round;
  }

  async function handleSpin() {
    if (!canSpin) {
      return;
    }

    setErrorCode(null);
    setResolvedRound(null);
    setActiveRound(null);
    setShowConfetti(false);
    setPointerLand(false);
    resetChallengeState(null);
    setIsPreparingRound(true);
    setIsSpinning(true);

    if (spinAnimationRef.current) {
      spinAnimationRef.current.stop();
    }

    const preparationStartRotation = rotation.get();
    spinAnimationRef.current = animate(
      rotation,
      preparationStartRotation + 360,
      {
        duration: 0.85,
        ease: "linear",
        repeat: Infinity,
      }
    );

    try {
      const round = await startWheelRoundRequest();

      if (!round) {
        if (spinAnimationRef.current) {
          spinAnimationRef.current.stop();
          spinAnimationRef.current = null;
        }
        setIsPreparingRound(false);
        setIsSpinning(false);
        return;
      }

      const categoryIndex = getCategoryIndex(round.category.slug);
      const normalizedIndex = categoryIndex >= 0 ? categoryIndex : 0;
      const currentRotation = rotation.get();
      const nextRotation = buildWheelRotation(
        currentRotation,
        normalizedIndex,
        segmentAngle
      );

      if (spinAnimationRef.current) {
        spinAnimationRef.current.stop();
        spinAnimationRef.current = null;
      }

      spinAnimationRef.current = animate(rotation, nextRotation, {
        duration: wheelDurationSeconds,
        ease: wheelEase,
      });

      setIsPreparingRound(false);

      spinTimeoutRef.current = window.setTimeout(() => {
        setIsSpinning(false);
        setPointerLand(true);
        setActiveRound(round);
        setIsChallengeOpen(true);
        resetChallengeState(round);

        window.setTimeout(() => {
          setPointerLand(false);
        }, 800);
      }, wheelDurationSeconds * 1000);
    } catch {
      if (spinAnimationRef.current) {
        spinAnimationRef.current.stop();
        spinAnimationRef.current = null;
      }
      setErrorCode("PERSISTENCE_ERROR");
      setIsPreparingRound(false);
      setIsSpinning(false);
    }
  }

  async function handleBeginTimedTask() {
    if (!activeRound || !isTimerRound || isStartingTimer || isResolving) {
      return;
    }

    setValidationMessage(null);
    setErrorCode(null);
    setIsStartingTimer(true);

    try {
      const round = await startWheelTimerRequest(activeRound);

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

  async function handleResolve(resolution: WheelRoundResolution) {
    if (!activeRound || isResolving || isStartingTimer) {
      return;
    }

    if (
      resolution === "completed" &&
      activeRound.task.responseMode === "text_input" &&
      responseText.trim().length === 0
    ) {
      setValidationMessage(t("overlay_text_input_required"));
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
        setIsResolving(false);
        return;
      }

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

      if (confettiTimeoutRef.current) {
        window.clearTimeout(confettiTimeoutRef.current);
      }

      confettiTimeoutRef.current = window.setTimeout(() => {
        setShowConfetti(false);
      }, 1000);
    } catch {
      setErrorCode("PERSISTENCE_ERROR");
      setIsResolving(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-6">
          <div
            className="relative overflow-hidden rounded-3xl border border-accent/12 shadow-[0_24px_64px_-32px_rgba(0,0,0,0.4)]"
          >
            {/* Top shimmer sweep during spin */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px overflow-hidden">
              <motion.div
                className="h-full w-2/5 bg-linear-to-r from-transparent via-accent/75 to-transparent"
                animate={
                  isSpinning || isPreparingRound
                    ? { x: ["-100%", "280%"] }
                    : { x: "-100%" }
                }
                transition={
                  isSpinning || isPreparingRound
                    ? { duration: 2.0, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
                    : { duration: 0 }
                }
              />
            </div>

            {/* Gradient background — own layer, isolated from child animations */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-bg-secondary to-bg-primary" />

            <div className="relative z-10 flex flex-col items-center gap-10 px-6 py-8 md:gap-12 md:px-8 md:py-10 lg:px-10">
              <div className="flex w-full items-center gap-3 mb-4 md:mb-6">
                <span className="h-px flex-1 bg-linear-to-r from-transparent via-accent/30 to-transparent" />
                <span className="rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[9px] uppercase tracking-[0.36em] text-accent">
                  {t("eyebrow")}
                </span>
                <span className="h-px flex-1 bg-linear-to-r from-transparent via-accent/30 to-transparent" />
              </div>

              <div className="relative mx-auto w-full max-w-80 sm:max-w-96 md:max-w-120 lg:max-w-xl">
                <motion.div
                  animate={{ rotate: isSpinning ? 360 : -360 }}
                  transition={{
                    duration: isSpinning ? 3.5 : 42,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                  className={cn(
                    "absolute -inset-5 rounded-full border border-dashed transition-colors duration-700",
                    isSpinning ? "border-accent/28" : "border-accent/10"
                  )}
                />

                {/* Spin glow */}
                <div
                  className={cn(
                    "absolute -inset-3 rounded-full blur-2xl transition-all duration-700",
                    isSpinning ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 70%)",
                  }}
                />
                {/* Idle ambient breathing glow */}
                {!isSpinning && !isPreparingRound && (
                  <motion.div
                    className="absolute -inset-4 rounded-full blur-3xl"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 65%)",
                    }}
                    animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.97, 1.03, 0.97] }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                <motion.div
                  className="absolute left-1/2 -top-2.5 z-30 -translate-x-1/2"
                  animate={
                    pointerLand
                      ? {
                          y: [0, -10, 2, -5, 0],
                          rotate: [0, -5, 5, -2, 0],
                        }
                      : { y: 0, rotate: 0 }
                  }
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 4px 10px color-mix(in srgb, var(--accent) 30%, transparent))" }}
                >
                  <svg
                    width="20"
                    height="28"
                    viewBox="0 0 20 28"
                    fill="none"
                    aria-hidden="true"
                  >
                    {/* Arrow body */}
                    <path d="M10 27 L1.5 7 Q4.5 1.5 10 1.5 Q15.5 1.5 18.5 7 Z" fill="var(--accent)" />
                    {/* Edge stroke for contrast against wheel */}
                    <path d="M10 27 L1.5 7 Q4.5 1.5 10 1.5 Q15.5 1.5 18.5 7 Z" fill="none" stroke="var(--bg-primary)" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </motion.div>

                <div
                  className="relative aspect-square w-full overflow-hidden rounded-full"
                  style={{
                    background: "var(--bg-primary)",
                    boxShadow: "0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent), 0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent), 0 28px 72px -20px rgba(0,0,0,0.28)",
                  }}
                >
                <motion.div
                  className="h-full w-full"
                  style={{ rotate: rotation, willChange: "transform" }}
                >
                    <svg
                      viewBox="0 0 100 100"
                      className="h-full w-full"
                      aria-hidden="true"
                    >
                      <defs>
                        {/* Base fill — matches page background */}
                        <radialGradient id="whlBase" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="var(--bg-secondary)" />
                          <stop offset="100%" stopColor="var(--bg-primary)" />
                        </radialGradient>
                        {/* Segment A — secondary background tone */}
                        <radialGradient id="whlSegA" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="var(--bg-secondary)" />
                          <stop offset="100%" stopColor="var(--bg-primary)" />
                        </radialGradient>
                        {/* Segment B — accent-tinted tone */}
                        <radialGradient id="whlSegB" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.36" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.10" />
                        </radialGradient>
                        {/* Edge vignette */}
                        <radialGradient id="whlVig" cx="50%" cy="50%" r="50%">
                          <stop offset="55%" stopColor="var(--bg-primary)" stopOpacity="0" />
                          <stop offset="100%" stopColor="var(--bg-primary)" stopOpacity="0.28" />
                        </radialGradient>
                        {/* Hub background */}
                        <radialGradient id="whlHub" cx="38%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="var(--bg-secondary)" />
                          <stop offset="100%" stopColor="var(--bg-primary)" />
                        </radialGradient>
                      </defs>

                      {/* Base */}
                      <circle cx="50" cy="50" r="50" fill="url(#whlBase)" />

                      {WHEEL_CONTENT_CATEGORIES.map((category, index) => {
                        const startAngle = index * segmentAngle;
                        const endAngle = (index + 1) * segmentAngle;
                        const midAngle = startAngle + segmentAngle / 2;
                        const numberPosition = polarToCartesian(33, midAngle);
                        const number = (index + 1).toString().padStart(2, "0");
                        const segFill = index % 2 === 0 ? "url(#whlSegA)" : "url(#whlSegB)";
                        const textFill = index % 2 === 0 ? "var(--accent)" : "var(--text-secondary)";

                        return (
                          <g key={category.slug}>
                            <path d={describeSlice(startAngle, endAngle)} fill={segFill} />
                            <line
                              x1="50" y1="50"
                              x2={polarToCartesian(48.5, startAngle).x}
                              y2={polarToCartesian(48.5, startAngle).y}
                              stroke="var(--accent)"
                              strokeOpacity="0.2"
                              strokeWidth="0.5"
                            />
                            <text
                              x={numberPosition.x}
                              y={numberPosition.y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={textFill}
                              fontSize="7"
                              fontWeight="600"
                              fontFamily="Cinzel, Georgia, serif"
                              letterSpacing="0.05em"
                            >
                              {number}
                            </text>
                          </g>
                        );
                      })}

                      {/* Edge vignette */}
                      <circle cx="50" cy="50" r="50" fill="url(#whlVig)" />

                      {/* Outer rim ring */}
                      <circle cx="50" cy="50" r="49" fill="none" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.55" />
                      {/* Inner accent hairline */}
                      <circle cx="50" cy="50" r="47.6" fill="none" stroke="var(--accent)" strokeWidth="0.3" strokeOpacity="0.18" />

                      {/* Hub — background disc */}
                      <circle cx="50" cy="50" r="10.5" fill="url(#whlHub)" />
                      {/* Hub — outer accent ring */}
                      <circle cx="50" cy="50" r="10.5" fill="none" stroke="var(--accent)" strokeWidth="0.7" strokeOpacity="0.55" />
                      {/* Hub — inner concentric ring */}
                      <circle cx="50" cy="50" r="7" fill="none" stroke="var(--accent)" strokeWidth="0.35" strokeOpacity="0.22" />
                      {/* Hub — center accent dot */}
                      <circle cx="50" cy="50" r="3.5" fill="var(--accent)" fillOpacity="0.65" />
                      {/* Hub — dot ring */}
                      <circle cx="50" cy="50" r="3.5" fill="none" stroke="var(--accent)" strokeWidth="0.4" strokeOpacity="0.5" />
                      {/* Hub — center void */}
                      <circle cx="50" cy="50" r="1.1" fill="var(--bg-primary)" />
                    </svg>
                  </motion.div>

                  {/* Rim shimmer — non-rotating arc sweeping around the bezel */}
                  {(isSpinning || isPreparingRound) && (
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                    >
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="48.5"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeOpacity="0.75"
                        strokeDasharray="48 259"
                        animate={{ strokeDashoffset: [0, -307] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                      />
                    </svg>
                  )}

                  {/* Non-rotating hub ripple rings */}
                  {!isSpinning && !isPreparingRound && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      {[0, 1.4, 2.8].map((delay) => (
                        <motion.div
                          key={delay}
                          className="absolute rounded-full border border-accent/40"
                          style={{ width: "21%", height: "21%" }}
                          animate={{ scale: [1, 1, 2.8], opacity: [0, 0.55, 0] }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay,
                            times: [0, 0.08, 1],
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 pb-2 mt-4 md:mt-6">
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={() => {
                      void handleSpin();
                    }}
                    disabled={!canSpin}
                    whileTap={canSpin ? { scale: 0.96 } : {}}
                    animate={canSpin && !displayRound ? { scale: [1, 1.022, 1] } : { scale: 1 }}
                    transition={
                      canSpin && !displayRound
                        ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.2 }
                    }
                    className={cn(
                      "relative min-w-48 overflow-hidden rounded-full py-3.5 text-sm font-semibold uppercase tracking-[0.22em] md:min-w-56",
                      canSpin
                        ? "cursor-pointer bg-accent text-bg-primary shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)]"
                        : "cursor-not-allowed bg-accent/25 text-bg-primary/50"
                    )}
                  >
                    {/* Shimmer — diagonal light band, slow and rare */}
                    {canSpin && (
                      <motion.div
                        className="pointer-events-none absolute inset-y-0 -left-full w-full -skew-x-12"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.12) 50%, transparent 80%)",
                        }}
                        animate={{ x: ["0%", "200%"] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          repeatDelay: 5.0,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                    <span className="relative z-10">
                      {isSpinning ? t("spinning_cta") : t("spin_cta")}
                    </span>
                  </motion.button>
                </div>

                <p className="mt-3 text-[10px] uppercase tracking-[0.26em] text-text-secondary/55">
                  {statusMessageKey ? t(statusMessageKey) : tCommon("tap_ready")}
                </p>
              </div>
            </div>
          </div>

          {/* ── CURRENT CHALLENGE ── */}
          <div className="relative overflow-hidden rounded-3xl border border-accent/12 bg-bg-primary/50 backdrop-blur-sm">
            {showConfetti && <ConfettiPop trigger={confettiKey} />}

            <AnimatePresence mode="wait">
              {displayRound ? (
                <motion.div
                  key={`${displayRound.roundId}-${resolvedRound?.resolution ?? "pending"}-${confettiKey}`}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.38, ease: wheelEase }}
                  className="p-6 md:p-8"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-0.75 rounded-t-3xl"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${activeColor}99, transparent)`,
                    }}
                  />

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-55" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.32em] text-accent">
                        {t("result_label")}
                      </span>
                    </div>
                    {resolvedRound && (
                      <span className="inline-flex rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">
                        {t(getResolutionKey(resolvedRound.resolution))}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-accent/30 bg-accent/12 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">
                      {displayRound.category.title}
                    </span>
                    <span className="inline-flex rounded-full border border-text-secondary/20 bg-text-primary/6 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                      {t(getInteractionLabelKey(displayRound.task.interactionType))}
                    </span>
                  </div>

                  <h3 className="heading-serif mt-5 text-2xl leading-snug text-text-primary md:text-3xl">
                    {displayRound.task.prompt}
                  </h3>

                  {displayRound.task.details && (
                    <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                      {displayRound.task.details}
                    </p>
                  )}

                  {resolvedRound ? (
                    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-accent/10 pt-6">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.16,
                          type: "spring",
                          stiffness: 320,
                          damping: 18,
                        }}
                        className="inline-flex items-baseline gap-1.5 rounded-full border border-accent/22 bg-accent/8 px-5 py-2.5"
                      >
                        <span className="font-cinzel text-3xl font-bold text-accent">
                          {resolvedRound.xpDelta > 0 ? "+" : ""}
                          {resolvedRound.xpDelta}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                          {tCommon("points_unit")}
                        </span>
                      </motion.div>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm leading-relaxed text-text-secondary">
                      {t("challenge_ready_note")}
                    </p>
                  )}

                  {wheelError && (
                    <p className="mt-5 rounded-2xl border border-accent/16 bg-bg-primary/60 px-4 py-3 text-xs text-text-secondary">
                      {wheelError}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-40 flex-col items-center justify-center gap-4 p-6 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 18, ease: "linear", repeat: Infinity }}
                    className="opacity-15"
                    style={{ fontSize: "2.5rem" }}
                    aria-hidden="true"
                  >
                    ◎
                  </motion.div>
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.32em] text-accent">
                      {t("result_label")}
                    </p>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {t("empty_state")}
                    </p>
                  </div>
                  {wheelError && (
                    <p className="rounded-2xl border border-accent/16 bg-bg-primary/60 px-4 py-3 text-xs text-text-secondary">
                      {wheelError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <div className="rounded-3xl border border-accent/10 bg-bg-primary/40 p-5 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.32em] text-accent">
                {t("rules_label")}
              </p>
              <div className="mt-4 space-y-3">
                {(["rule_one", "rule_two", "rule_three", "rule_four"] as const).map(
                  (key, index) => (
                    <div key={key} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 font-cinzel text-[9px] text-accent">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-text-secondary">
                        {t(key)}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-accent/10 bg-bg-primary/40 p-5 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.32em] text-accent">
                {t("recent_label")}
              </p>
              {recentResults.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <AnimatePresence initial={false}>
                    {recentResults.map((result, index) => (
                      <motion.div
                        key={result.roundId}
                        initial={index === 0 ? { opacity: 0, x: -10 } : {}}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-accent/8 bg-bg-primary/40 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background: getCategoryColor(result.categorySlug),
                              opacity: 0.85,
                            }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-text-primary">
                              {result.prompt}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-text-secondary/60">
                              {result.categoryTitle} · {t(getResolutionKey(result.resolution))}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            result.xpDelta >= 0 ? "text-accent" : "text-rose-300"
                          )}
                        >
                          {result.xpDelta > 0 ? "+" : ""}
                          {result.xpDelta}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                  {t("recent_empty")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-accent/10 bg-bg-primary/40 backdrop-blur-sm">
          <div className="flex items-center gap-4 border-b border-accent/8 px-6 py-5 md:px-8">
            <p className="text-[10px] uppercase tracking-[0.32em] text-accent">
              {t("legend_label")}
            </p>
            <span className="h-px flex-1 bg-linear-to-r from-accent/20 to-transparent" />
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3">
            {WHEEL_CONTENT_CATEGORIES.map((category, index) => {
              const number = (index + 1).toString().padStart(2, "0");

              return (
                <motion.div
                  key={category.slug}
                  whileHover={{ backgroundColor: "rgba(202,167,106,0.04)", transition: { duration: 0.2 } }}
                  className="group/item relative overflow-hidden border-b border-r border-accent/8 p-5 md:p-6 last:border-b-0 nth-last-[-n+3]:xl:border-b-0 nth-last-[-n+2]:sm:border-b-0"
                >
                  {/* Watermark number */}
                  <span
                    className="pointer-events-none absolute -right-1 -top-2 select-none font-cinzel text-[5.5rem] font-bold leading-none text-accent/5 transition-colors duration-500 group-hover/item:text-accent/8"
                    aria-hidden="true"
                  >
                    {number}
                  </span>

                  {/* Number label */}
                  <p className="relative font-cinzel text-[11px] tracking-[0.22em] text-accent/55">
                    {number}
                  </p>

                  {/* Title */}
                  <h3 className="relative mt-3 text-base font-medium leading-snug text-text-primary">
                    {category.title[locale]}
                  </h3>

                  {/* Description */}
                  <p className="relative mt-2 text-sm leading-relaxed text-text-secondary/75">
                    {category.description[locale]}
                  </p>

                  {/* Count */}
                  <p className="relative mt-4 text-[9px] uppercase tracking-[0.26em] text-text-secondary/30">
                    {t("legend_count", { count: 20 })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isChallengeOpen && activeRound ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,12,17,0.66)] p-3 backdrop-blur-md md:items-center md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.24, ease: wheelEase }}
              className="relative w-full max-w-2xl overflow-hidden rounded-4xl border border-accent/16 bg-bg-primary shadow-[0_32px_120px_-40px_rgba(0,0,0,0.8)]"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${getCategoryColor(
                    activeRound.category.slug
                  )}, transparent)`,
                }}
              />

              <div className="p-5 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-accent">
                    {t("overlay_label")}
                  </span>
                  <span className="rounded-full border border-text-secondary/20 bg-text-primary/6 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                    {activeRound.category.title}
                  </span>
                  <span className="rounded-full border border-text-secondary/20 bg-text-primary/6 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                    {t(getInteractionLabelKey(activeRound.task.interactionType))}
                  </span>
                </div>

                <h2 className="heading-serif mt-5 text-3xl leading-snug text-text-primary md:text-4xl">
                  {activeRound.task.prompt}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
                  {activeRound.task.details || activeRound.category.description}
                </p>

                <div
                  className={cn(
                    "mt-6 grid gap-3",
                    canPromiseActiveRound ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  )}
                >
                  <div className="rounded-2xl border border-accent/10 bg-bg-secondary/40 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/65">
                      {t("overlay_complete_note")}
                    </p>
                    <p className="mt-2 font-cinzel text-2xl text-accent">
                      +{activeRound.task.completionXp}
                    </p>
                  </div>
                  {canPromiseActiveRound ? (
                    <div className="rounded-2xl border border-accent/10 bg-bg-secondary/40 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/65">
                        {t("overlay_promise_note")}
                      </p>
                      <p className="mt-2 font-cinzel text-2xl text-accent">
                        +{activeRound.task.promiseXp}
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-accent/10 bg-bg-secondary/40 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/65">
                      {t("overlay_skip_note")}
                    </p>
                    <p className="mt-2 font-cinzel text-2xl text-rose-300">
                      {activeRound.task.skipPenaltyXp}
                    </p>
                  </div>
                </div>

                {activeRound.task.responseMode === "text_input" ? (
                  <div className="mt-6 space-y-3">
                    <label
                      htmlFor="wheel-response"
                      className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/65"
                    >
                      {t("overlay_response_label")}
                    </label>
                    <textarea
                      id="wheel-response"
                      value={responseText}
                      onChange={(event) => {
                        setResponseText(event.target.value);
                        setValidationMessage(null);
                      }}
                      placeholder={t("overlay_response_placeholder")}
                      className="min-h-32 w-full rounded-2xl border border-accent/12 bg-bg-secondary/50 px-4 py-3 text-sm text-text-primary outline-none transition-colors duration-200 placeholder:text-text-secondary/45 focus:border-accent/30"
                    />
                  </div>
                ) : null}

                {activeRound.task.executionMode === "timed" ? (
                  <div className="mt-6 rounded-2xl border border-accent/10 bg-bg-secondary/40 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/65">
                      {t("overlay_timer_label")}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div>
                        <p className="font-cinzel text-4xl text-text-primary">
                          {String(timerRemaining ?? activeRound.task.timerSeconds ?? 0).padStart(2, "0")}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {timerStatus === "idle"
                            ? t("overlay_timer_start")
                            : timerStatus === "running"
                              ? t("overlay_timer_running")
                              : t("overlay_timer_complete")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {validationMessage && (
                  <p className="mt-5 rounded-2xl border border-accent/14 bg-bg-secondary/50 px-4 py-3 text-sm text-text-secondary">
                    {validationMessage}
                  </p>
                )}

                {wheelError && (
                  <p className="mt-5 rounded-2xl border border-accent/14 bg-bg-secondary/50 px-4 py-3 text-sm text-text-secondary">
                    {wheelError}
                  </p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      if (isTimerRound && timerStatus === "idle") {
                        void handleBeginTimedTask();
                        return;
                      }

                      void handleResolve("completed");
                    }}
                    disabled={
                      isStartingTimer ||
                      isResolving ||
                      (isTimerRound &&
                        timerStatus === "running" &&
                        !activeRound?.task.allowEarlyCompletion)
                    }
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-bg-primary transition-colors duration-200 hover:bg-accent-hover disabled:cursor-wait disabled:bg-accent/45"
                  >
                    {isStartingTimer
                      ? t("overlay_timer_starting_cta")
                      : isResolving
                      ? t("overlay_resolving")
                      : isTimerRound
                        ? timerStatus === "idle"
                          ? t("overlay_timer_begin_cta")
                          : timerStatus === "running"
                            ? canFinishTimedRoundEarly
                              ? t("overlay_timer_finish_early_cta")
                              : t("overlay_timer_running_cta")
                            : t("overlay_complete_cta")
                        : t("overlay_complete_cta")}
                  </button>
                  {canPromiseActiveRound ? (
                    <button
                      type="button"
                      onClick={() => {
                        void handleResolve("promised");
                      }}
                      disabled={isStartingTimer || isResolving}
                      className="rounded-full border border-accent/16 bg-bg-secondary/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-primary transition-colors duration-200 hover:border-accent/28 disabled:cursor-wait disabled:opacity-60"
                    >
                      {t("overlay_promise_cta")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      void handleResolve("skipped");
                    }}
                    disabled={isStartingTimer || isResolving}
                    className="rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-secondary transition-colors duration-200 hover:border-white/20 hover:text-text-primary disabled:cursor-wait disabled:opacity-60"
                  >
                    {t("overlay_skip_cta")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
