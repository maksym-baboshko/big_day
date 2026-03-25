"use client";

import { WEDDING_DATE } from "@/shared/config";
import { cn } from "@/shared/lib";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

let _now = 0;

function subscribe(cb: () => void) {
  const timer = setInterval(() => {
    _now = Date.now();
    cb();
  }, 1000);
  return () => clearInterval(timer);
}

const getSnapshot = () => (_now === 0 ? Date.now() : _now);
const getServerSnapshot = () => 0;

interface TimeUnit {
  value: number;
  labelKey: "days" | "hours" | "minutes" | "seconds";
}

function getTimeLeft(target: Date, now: number): TimeUnit[] | null {
  if (now === 0) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return null;
  return [
    { value: Math.floor(diff / 86_400_000), labelKey: "days" },
    { value: Math.floor((diff % 86_400_000) / 3_600_000), labelKey: "hours" },
    { value: Math.floor((diff % 3_600_000) / 60_000), labelKey: "minutes" },
    { value: Math.floor((diff % 60_000) / 1_000), labelKey: "seconds" },
  ];
}

interface CountdownProps {
  className?: string;
}

export function Countdown({ className }: CountdownProps) {
  const t = useTranslations("Countdown");
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const units = getTimeLeft(WEDDING_DATE, now);

  if (!units) return null;

  return (
    <div className={cn("flex items-end gap-6 sm:gap-10", className)}>
      {units.map(({ value, labelKey }) => (
        <div key={labelKey} className="flex flex-col items-center gap-1">
          <span className="font-cinzel tabular-nums text-3xl font-bold leading-none text-accent sm:text-4xl md:text-5xl">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-text-secondary">
            {t(labelKey)}
          </span>
        </div>
      ))}
    </div>
  );
}
