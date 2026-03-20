"use client";

import { useEffect, useRef } from "react";
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
} from "@/shared/config";
import type { PlayerSessionSnapshot } from "@/features/game-session";
import { cn } from "@/shared/lib";
import { ConfettiPop } from "./ConfettiPop";
import { WheelChallengeOverlay } from "./WheelChallengeOverlay";
import { WheelLeaderboardCard } from "./WheelLeaderboardCard";
import {
  buildWheelRotation,
  describeSlice,
  getCategoryColor,
  getCategoryIndex,
  getInteractionLabelKey,
  getResolutionKey,
  polarToCartesian,
  WHEEL_VISUAL_SEGMENT_COUNT,
  wheelEase,
} from "./wheel-helpers";
import { useWheelGame } from "./useWheelGame";

const wheelDurationSeconds = 4.6;

interface WheelOfFortuneGameProps {
  onPlayerUpdate: (session: PlayerSessionSnapshot) => void;
}

export function WheelOfFortuneGame({
  onPlayerUpdate,
}: WheelOfFortuneGameProps) {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("WheelOfFortune");
  const tCommon = useTranslations("GamesCommon");

  // ── Animation state (component-owned) ─────────────────────────────────────
  const rotation = useMotionValue(0);
  const spinTimeoutRef = useRef<number | null>(null);
  const spinAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const idleAnimationRef = useRef<AnimationPlaybackControls | null>(null);

  const segmentAngle = 360 / WHEEL_VISUAL_SEGMENT_COUNT;

  // ── Game state + actions (hook-owned) ─────────────────────────────────────
  const game = useWheelGame({ locale, onPlayerUpdate });

  // ── Effects ────────────────────────────────────────────────────────────────

  // Cleanup animation handles on unmount
  useEffect(
    () => () => {
      if (spinTimeoutRef.current) window.clearTimeout(spinTimeoutRef.current);
      spinAnimationRef.current?.stop();
      idleAnimationRef.current?.stop();
    },
    []
  );

  // Idle slow rotation — plays whenever the wheel is at rest
  useEffect(() => {
    if (!game.isSpinning && !game.isPreparingRound) {
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
  }, [game.isPreparingRound, game.isSpinning, rotation]);

  // ── Spin handler (bridges animation ↔ game hook) ──────────────────────────

  async function handleSpin() {
    if (!game.canSpin) return;

    game.beginSpin();

    spinAnimationRef.current?.stop();
    const preparationStartRotation = rotation.get();
    spinAnimationRef.current = animate(
      rotation,
      preparationStartRotation + 360,
      { duration: 0.85, ease: "linear", repeat: Infinity }
    );

    try {
      const round = await game.startRoundRequest();

      if (!round) {
        // errorCode was already set inside startRoundRequest
        spinAnimationRef.current?.stop();
        spinAnimationRef.current = null;
        game.setIsPreparingRound(false);
        game.setIsSpinning(false);
        return;
      }

      const categoryIndex = getCategoryIndex(round.category.slug);
      const normalizedIndex = categoryIndex >= 0 ? categoryIndex : 0;
      const nextRotation = buildWheelRotation(
        rotation.get(),
        normalizedIndex,
        segmentAngle
      );

      spinAnimationRef.current?.stop();
      spinAnimationRef.current = animate(rotation, nextRotation, {
        duration: wheelDurationSeconds,
        ease: wheelEase,
      });

      game.setPreparingDone();

      spinTimeoutRef.current = window.setTimeout(() => {
        game.finalizeSpinRound(round);
        window.setTimeout(() => {
          game.clearPointerLand();
        }, 800);
      }, wheelDurationSeconds * 1000);
    } catch {
      spinAnimationRef.current?.stop();
      spinAnimationRef.current = null;
      game.setErrorCode("PERSISTENCE_ERROR");
      game.setIsPreparingRound(false);
      game.setIsSpinning(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
                  game.isSpinning || game.isPreparingRound
                    ? { x: ["-100%", "280%"] }
                    : { x: "-100%" }
                }
                transition={
                  game.isSpinning || game.isPreparingRound
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
                  animate={{ rotate: game.isSpinning ? 360 : -360 }}
                  transition={{
                    duration: game.isSpinning ? 3.5 : 42,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                  className={cn(
                    "absolute -inset-5 rounded-full border border-dashed transition-colors duration-700",
                    game.isSpinning ? "border-accent/28" : "border-accent/10"
                  )}
                />

                {/* Spin glow */}
                <div
                  className={cn(
                    "absolute -inset-3 rounded-full blur-2xl transition-all duration-700",
                    game.isSpinning ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 70%)",
                  }}
                />
                {/* Idle ambient breathing glow */}
                {!game.isSpinning && !game.isPreparingRound && (
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
                    game.pointerLand
                      ? { y: [0, -10, 2, -5, 0], rotate: [0, -5, 5, -2, 0] }
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
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M10 27 L1.5 7 Q4.5 1.5 10 1.5 Q15.5 1.5 18.5 7 Z" fill="var(--accent)" />
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
                        <radialGradient id="whlBase" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="var(--bg-secondary)" />
                          <stop offset="100%" stopColor="var(--bg-primary)" />
                        </radialGradient>
                        <radialGradient id="whlSegA" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="var(--bg-secondary)" />
                          <stop offset="100%" stopColor="var(--bg-primary)" />
                        </radialGradient>
                        <radialGradient id="whlSegB" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.36" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.10" />
                        </radialGradient>
                        <radialGradient id="whlVig" cx="50%" cy="50%" r="50%">
                          <stop offset="55%" stopColor="var(--bg-primary)" stopOpacity="0" />
                          <stop offset="100%" stopColor="var(--bg-primary)" stopOpacity="0.28" />
                        </radialGradient>
                        <radialGradient id="whlHub" cx="38%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="var(--bg-secondary)" />
                          <stop offset="100%" stopColor="var(--bg-primary)" />
                        </radialGradient>
                      </defs>

                      <circle cx="50" cy="50" r="50" fill="url(#whlBase)" />

                      {Array.from({ length: WHEEL_VISUAL_SEGMENT_COUNT }).map(
                        (_, index) => {
                          const visualSegmentKey =
                            WHEEL_CONTENT_CATEGORIES[index]?.slug ??
                            `wheel-visual-stub-${index + 1}`;
                          const startAngle = index * segmentAngle;
                          const endAngle = (index + 1) * segmentAngle;
                          const midAngle = startAngle + segmentAngle / 2;
                          const numberPosition = polarToCartesian(33, midAngle);
                          const number = (index + 1).toString().padStart(2, "0");
                          const segFill = index % 2 === 0 ? "url(#whlSegA)" : "url(#whlSegB)";
                          const textFill = index % 2 === 0 ? "var(--accent)" : "var(--text-secondary)";

                          return (
                            <g key={visualSegmentKey}>
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
                        }
                      )}

                      <circle cx="50" cy="50" r="50" fill="url(#whlVig)" />
                      <circle cx="50" cy="50" r="49" fill="none" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.55" />
                      <circle cx="50" cy="50" r="47.6" fill="none" stroke="var(--accent)" strokeWidth="0.3" strokeOpacity="0.18" />
                      <circle cx="50" cy="50" r="10.5" fill="url(#whlHub)" />
                      <circle cx="50" cy="50" r="10.5" fill="none" stroke="var(--accent)" strokeWidth="0.7" strokeOpacity="0.55" />
                      <circle cx="50" cy="50" r="7" fill="none" stroke="var(--accent)" strokeWidth="0.35" strokeOpacity="0.22" />
                      <circle cx="50" cy="50" r="3.5" fill="var(--accent)" fillOpacity="0.65" />
                      <circle cx="50" cy="50" r="3.5" fill="none" stroke="var(--accent)" strokeWidth="0.4" strokeOpacity="0.5" />
                      <circle cx="50" cy="50" r="1.1" fill="var(--bg-primary)" />
                    </svg>
                  </motion.div>

                  {/* Non-rotating hub ripple rings */}
                  {!game.isSpinning && !game.isPreparingRound && (
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
                    disabled={!game.canSpin}
                    whileTap={game.canSpin ? { scale: 0.96 } : {}}
                    animate={
                      game.canSpin && !game.displayRound
                        ? { scale: [1, 1.022, 1] }
                        : { scale: 1 }
                    }
                    transition={
                      game.canSpin && !game.displayRound
                        ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.2 }
                    }
                    className={cn(
                      "relative min-w-48 overflow-hidden rounded-full py-3.5 text-sm font-semibold uppercase tracking-[0.22em] md:min-w-56",
                      game.canSpin
                        ? "cursor-pointer bg-accent text-bg-primary shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)]"
                        : "cursor-not-allowed bg-accent/25 text-bg-primary/50"
                    )}
                  >
                    {/* Shimmer — diagonal light band, slow and rare */}
                    {game.canSpin && (
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
                      {game.isSpinning ? t("spinning_cta") : t("spin_cta")}
                    </span>
                  </motion.button>
                </div>

                <p className="mt-3 text-[10px] uppercase tracking-[0.26em] text-text-secondary/55">
                  {game.statusMessageKey ? t(game.statusMessageKey) : tCommon("tap_ready")}
                </p>
              </div>
            </div>
          </div>

          {/* ── CURRENT CHALLENGE ── */}
          <div className="relative overflow-hidden rounded-3xl border border-accent/12 bg-bg-primary/50 backdrop-blur-sm">
            {game.showConfetti && <ConfettiPop trigger={game.confettiKey} />}

            <AnimatePresence mode="wait">
              {game.displayRound ? (
                <motion.div
                  key={`${game.displayRound.roundId}-${game.resolvedRound?.resolution ?? "pending"}-${game.confettiKey}`}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.38, ease: wheelEase }}
                  className="p-6 md:p-8"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-0.75 rounded-t-3xl"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${game.activeColor}99, transparent)`,
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
                    {game.resolvedRound && (
                      <span className="inline-flex rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">
                        {t(getResolutionKey(game.resolvedRound.resolution))}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-accent/30 bg-accent/12 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">
                      {game.displayRound.category.title}
                    </span>
                    <span className="inline-flex rounded-full border border-text-secondary/20 bg-text-primary/6 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                      {t(getInteractionLabelKey(game.displayRound.task))}
                    </span>
                  </div>

                  <h3 className="heading-serif mt-5 text-2xl leading-snug text-text-primary md:text-3xl">
                    {game.displayRound.task.prompt}
                  </h3>

                  {game.displayRound.task.details && (
                    <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                      {game.displayRound.task.details}
                    </p>
                  )}

                  {game.resolvedRound ? (
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
                          {game.resolvedRound.xpDelta > 0 ? "+" : ""}
                          {game.resolvedRound.xpDelta}
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

                  {game.wheelError && (
                    <p className="mt-5 rounded-2xl border border-accent/16 bg-bg-primary/60 px-4 py-3 text-xs text-text-secondary">
                      {game.wheelError}
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
                  {game.wheelError && (
                    <p className="rounded-2xl border border-accent/16 bg-bg-primary/60 px-4 py-3 text-xs text-text-secondary">
                      {game.wheelError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
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
              {game.recentResults.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <AnimatePresence initial={false}>
                    {game.recentResults.map((result, index) => (
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

            <WheelLeaderboardCard />
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
                  <span
                    className="pointer-events-none absolute -right-1 -top-2 select-none font-cinzel text-[5.5rem] font-bold leading-none text-accent/5 transition-colors duration-500 group-hover/item:text-accent/8"
                    aria-hidden="true"
                  >
                    {number}
                  </span>

                  <p className="relative font-cinzel text-[11px] tracking-[0.22em] text-accent/55">
                    {number}
                  </p>

                  <h3 className="relative mt-3 text-base font-medium leading-snug text-text-primary">
                    {category.title[locale]}
                  </h3>

                  <p className="relative mt-2 text-sm leading-relaxed text-text-secondary/75">
                    {category.description[locale]}
                  </p>

                  <p className="relative mt-4 text-[9px] uppercase tracking-[0.26em] text-text-secondary/30">
                    {t("legend_count", { count: 20 })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {game.activeRound ? (
        <WheelChallengeOverlay
          activeRound={game.activeRound}
          isOpen={game.isChallengeOpen}
          isStartingTimer={game.isStartingTimer}
          isResolving={game.isResolving}
          isTimerRound={game.isTimerRound}
          timerStatus={game.timerStatus}
          timerRemaining={game.timerRemaining}
          canFinishTimedRoundEarly={game.canFinishTimedRoundEarly}
          canPromise={game.canPromiseActiveRound}
          responseText={game.responseText}
          validationMessage={game.validationMessage}
          wheelError={game.wheelError}
          onResponseTextChange={(value) => {
            game.setResponseText(value);
          }}
          onBeginTimedTask={() => {
            void game.handleBeginTimedTask();
          }}
          onResolve={(resolution) => {
            void game.handleResolve(resolution);
          }}
        />
      ) : null}
    </>
  );
}
