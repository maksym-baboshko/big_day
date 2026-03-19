"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { WheelRoundResolution, WheelRoundSnapshot } from "@/features/game-session";
import { cn } from "@/shared/lib";
import {
  getCategoryColor,
  getInteractionLabelKey,
  wheelEase,
} from "./wheel-helpers";

interface WheelChallengeOverlayProps {
  activeRound: WheelRoundSnapshot;
  isOpen: boolean;
  isStartingTimer: boolean;
  isResolving: boolean;
  isTimerRound: boolean;
  timerStatus: "idle" | "running" | "paused" | "done";
  timerRemaining: number | null;
  canFinishTimedRoundEarly: boolean;
  canPromise: boolean;
  responseText: string;
  validationMessage: string | null;
  wheelError: string | null;
  onResponseTextChange: (value: string) => void;
  onBeginTimedTask: () => void;
  onResolve: (resolution: WheelRoundResolution) => void;
}

export function WheelChallengeOverlay({
  activeRound,
  isOpen,
  isStartingTimer,
  isResolving,
  isTimerRound,
  timerStatus,
  timerRemaining,
  canFinishTimedRoundEarly,
  canPromise,
  responseText,
  validationMessage,
  wheelError,
  onResponseTextChange,
  onBeginTimedTask,
  onResolve,
}: WheelChallengeOverlayProps) {
  const t = useTranslations("WheelOfFortune");

  return (
    <AnimatePresence>
      {isOpen && activeRound ? (
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
                  {t(getInteractionLabelKey(activeRound.task))}
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
                  canPromise ? "sm:grid-cols-3" : "sm:grid-cols-2"
                )}
              >
                <div className="rounded-2xl border border-accent/10 bg-bg-secondary/40 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/65">
                    {t(
                      activeRound.task.responseMode === "choice"
                        ? "overlay_choice_note"
                        : "overlay_complete_note"
                    )}
                  </p>
                  <p className="mt-2 font-cinzel text-2xl text-accent">
                    +{activeRound.task.completionXp}
                  </p>
                </div>
                {canPromise ? (
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

              {activeRound.task.responseMode === "choice" ? (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-text-secondary/65">
                    {t("overlay_choice_label")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(activeRound.task.choiceOptions ?? []).map((option) => {
                      const isSelected = responseText === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            onResponseTextChange(option);
                          }}
                          aria-pressed={isSelected}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left text-sm transition-colors duration-200",
                            isSelected
                              ? "border-accent/38 bg-accent/12 text-text-primary"
                              : "border-accent/12 bg-bg-secondary/50 text-text-secondary hover:border-accent/24 hover:text-text-primary"
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : activeRound.task.responseMode === "text_input" ? (
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
                      onResponseTextChange(event.target.value);
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
                            : timerStatus === "paused"
                              ? t("overlay_timer_paused")
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
                    if (
                      isTimerRound &&
                      (timerStatus === "idle" || timerStatus === "paused")
                    ) {
                      onBeginTimedTask();
                      return;
                    }

                    onResolve("completed");
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
                        : timerStatus === "paused"
                          ? t("overlay_timer_resume_cta")
                        : timerStatus === "running"
                          ? canFinishTimedRoundEarly
                            ? t("overlay_timer_finish_early_cta")
                            : t("overlay_timer_running_cta")
                          : activeRound.task.responseMode === "choice"
                            ? t("overlay_choice_cta")
                            : t("overlay_complete_cta")
                      : activeRound.task.responseMode === "choice"
                        ? t("overlay_choice_cta")
                        : t("overlay_complete_cta")}
                </button>
                {canPromise ? (
                  <button
                    type="button"
                    onClick={() => {
                      onResolve("promised");
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
                    onResolve("skipped");
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
  );
}
