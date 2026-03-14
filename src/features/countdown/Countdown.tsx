"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { WEDDING_DATE } from "@/shared/config";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_MS = WEDDING_DATE.getTime();

function calculateTimeLeft(): TimeLeft {
  const diff = TARGET_MS - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

let globalStore = calculateTimeLeft();
const listeners = new Set<() => void>();
let countdownIntervalStarted = false;

function ensureCountdownInterval() {
  if (typeof window === "undefined" || countdownIntervalStarted) {
    return;
  }

  countdownIntervalStarted = true;
  window.setInterval(() => {
    globalStore = calculateTimeLeft();
    listeners.forEach((callback) => callback());
  }, 1000);
}

function subscribe(callback: () => void) {
  ensureCountdownInterval();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return globalStore;
}

const SERVER_SNAPSHOT: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function getServerSnapshot(): TimeLeft {
  return SERVER_SNAPSHOT;
}

export function Countdown() {
  const t = useTranslations("Countdown");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const timeLeft = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <div className="flex gap-4 md:gap-8 justify-center opacity-0">
        {["days", "hours", "minutes", "seconds"].map((unit) => (
          <div key={unit} className="flex flex-col items-center min-w-16">
            <span className="text-3xl md:text-5xl font-serif text-text-primary mb-1">00</span>
            <span className="text-xs md:text-sm tracking-widest uppercase text-text-secondary">
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
    <div className="flex items-start justify-center">
      {entries.map((item, index) => (
        <div key={item.label} className="flex items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
            className="flex flex-col items-center min-w-16 md:min-w-20 px-2 md:px-4"
          >
            <span className="text-4xl md:text-5xl font-cinzel font-medium text-text-primary mb-3 tabular-nums tracking-widest leading-none">
              {item.value.toString().padStart(2, "0")}
            </span>
            <span className="text-[11px] md:text-sm tracking-[0.2em] uppercase text-accent font-medium">
              {item.label}
            </span>
          </motion.div>
          {index < entries.length - 1 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              className="font-cinzel text-2xl md:text-3xl text-accent/30 mt-1 select-none"
            >
              ·
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}
