"use client";

import { useEffect, useState } from "react";
import type { SupportedLocale } from "@/shared/config";
import { formatCurrentTime } from "./live-projector-helpers";

export function LiveClock({ locale }: { locale: SupportedLocale }) {
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    const initialTickId = window.setTimeout(() => {
      setTime(formatCurrentTime(locale));
    }, 0);

    const id = window.setInterval(() => {
      setTime(formatCurrentTime(locale));
    }, 1000);

    return () => {
      window.clearTimeout(initialTickId);
      window.clearInterval(id);
    };
  }, [locale]);

  return (
    <span className="font-cinzel tabular-nums text-2xl text-text-primary/55 md:text-3xl">
      <time suppressHydrationWarning>{time}</time>
    </span>
  );
}
