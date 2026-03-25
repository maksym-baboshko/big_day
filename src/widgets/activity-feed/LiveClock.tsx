"use client";

import { useEffect, useState } from "react";

function getTimeParts() {
  const now = new Date();
  return {
    hh: String(now.getHours()).padStart(2, "0"),
    mm: String(now.getMinutes()).padStart(2, "0"),
    ss: String(now.getSeconds()).padStart(2, "0"),
  };
}

export function LiveClock() {
  const [parts, setParts] = useState({ hh: "00", mm: "00", ss: "00" });

  useEffect(() => {
    const initialTickId = window.setTimeout(() => {
      setParts(getTimeParts());
    }, 0);
    const id = window.setInterval(() => {
      setParts(getTimeParts());
    }, 1000);
    return () => {
      window.clearTimeout(initialTickId);
      window.clearInterval(id);
    };
  }, []);

  return (
    <time
      suppressHydrationWarning
      className="flex items-baseline text-base font-medium text-accent"
    >
      <span className="inline-block w-[2ch] text-center tracking-widest">{parts.hh}</span>
      <span className="mx-[0.3ch] text-accent/55">:</span>
      <span className="inline-block w-[2ch] text-center tracking-widest">{parts.mm}</span>
      <span className="mx-[0.3ch] text-accent/35">:</span>
      <span className="inline-block w-[2ch] text-center tracking-widest text-accent/35">
        {parts.ss}
      </span>
    </time>
  );
}
