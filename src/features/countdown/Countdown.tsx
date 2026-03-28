"use client";

import { WEDDING_DATE } from "@/shared/config";
import { cn } from "@/shared/lib";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useSyncExternalStore } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  className?: string;
  nowMs?: number;
}

const TARGET_MS = WEDDING_DATE.getTime();
const SERVER_SNAPSHOT: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

let globalStore = calculateTimeLeft(Date.now());
const listeners = new Set<() => void>();
let countdownIntervalStarted = false;

function calculateTimeLeft(nowMs: number): TimeLeft {
  const diff = TARGET_MS - nowMs;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function subscribeStatic(): () => void {
  return () => undefined;
}

function ensureCountdownInterval(): void {
  if (typeof window === "undefined" || countdownIntervalStarted) {
    return;
  }

  countdownIntervalStarted = true;
  window.setInterval(() => {
    globalStore = calculateTimeLeft(Date.now());
    for (const callback of listeners) {
      callback();
    }
  }, 1000);
}

function subscribe(callback: () => void): () => void {
  ensureCountdownInterval();
  listeners.add(callback);

  return () => listeners.delete(callback);
}

function getSnapshot(): TimeLeft {
  return globalStore;
}

function getServerSnapshot(): TimeLeft {
  return SERVER_SNAPSHOT;
}

export function Countdown({ className, nowMs }: CountdownProps) {
  const t = useTranslations("Countdown");
  const reduceMotion = useReducedMotion();
  const mountedStore = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const fixedTimeLeft = useMemo(
    () => (typeof nowMs === "number" ? calculateTimeLeft(nowMs) : null),
    [nowMs],
  );
  const mounted = typeof nowMs === "number" ? true : mountedStore;
  const timeLeft = useSyncExternalStore(
    typeof nowMs === "number" ? subscribeStatic : subscribe,
    typeof nowMs === "number" ? () => fixedTimeLeft ?? SERVER_SNAPSHOT : getSnapshot,
    typeof nowMs === "number" ? () => fixedTimeLeft ?? SERVER_SNAPSHOT : getServerSnapshot,
  );

  if (!mounted) {
    return (
      <div
        data-testid="countdown"
        className={cn("flex justify-center gap-4 opacity-0 md:gap-8", className)}
      >
        {["days", "hours", "minutes", "seconds"].map((unit) => (
          <div key={unit} className="flex min-w-16 flex-col items-center">
            <span className="mb-1 font-serif text-3xl text-text-primary md:text-5xl">00</span>
            <span className="text-xs uppercase tracking-widest text-text-secondary md:text-sm">
              {t(unit)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const entries = [
    { label: t("days"), value: timeLeft.days },
    { label: t("hours"), value: timeLeft.hours },
    { label: t("minutes"), value: timeLeft.minutes },
    { label: t("seconds"), value: timeLeft.seconds },
  ];

  return (
    <div data-testid="countdown" className={cn("flex items-start justify-center", className)}>
      {entries.map((item, index) => (
        <div key={item.label} className="flex items-start">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }
            }
            className="flex min-w-16 flex-col items-center px-2 md:min-w-20 md:px-4"
          >
            <span className="mb-3 font-cinzel text-[2.625rem] leading-none font-medium tabular-nums tracking-widest text-text-primary md:text-5xl">
              {item.value.toString().padStart(2, "0")}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent md:text-sm">
              {item.label}
            </span>
          </motion.div>
          {index < entries.length - 1 ? (
            <motion.span
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={reduceMotion ? undefined : { duration: 0.8, delay: 0.3 + index * 0.1 }}
              className="mt-1 select-none font-cinzel text-[1.75rem] text-accent/45 md:text-[2.1rem]"
            >
              ·
            </motion.span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
