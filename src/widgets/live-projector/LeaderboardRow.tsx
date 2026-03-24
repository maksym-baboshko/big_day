"use client";

import { motion } from "framer-motion";
import type { LeaderboardEntrySnapshot } from "./types";
import { cn } from "@/shared/lib";
import { getAvatarMonogram } from "./live-projector-helpers";

export function LeaderboardRow({
  entry,
  isLeader,
}: {
  entry: LeaderboardEntrySnapshot;
  isLeader: boolean;
}) {
  if (isLeader) {
    return (
      <motion.div
        layout
        className="relative overflow-hidden rounded-3xl border border-accent/18 bg-accent/7 px-5 py-4 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.45)]"
      >
        {/* Thin top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/65 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="font-cinzel text-4xl leading-none text-accent">1</div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent/32 bg-accent/12 font-cinzel text-sm tracking-[0.14em] text-accent">
            {getAvatarMonogram(entry.avatarKey, entry.nickname)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-normal leading-tight text-text-primary">
              {entry.nickname}
            </p>
          </div>
          <div className="shrink-0 flex items-baseline gap-1.5">
            <span className="font-cinzel text-3xl leading-none text-accent">
              {entry.totalPoints}
            </span>
            <span className="font-cinzel text-[9px] uppercase tracking-[0.22em] text-text-secondary/50">
              XP
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.45)]",
        entry.rank === 2 || entry.rank === 3
          ? "border-accent/14 bg-bg-secondary/30"
          : "border-accent/8 bg-bg-secondary/30"
      )}
    >
      <div className="w-6 shrink-0 text-center font-cinzel text-base text-accent/60">
        {entry.rank}
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/16 bg-accent/8 font-cinzel text-xs tracking-[0.14em] text-accent">
        {getAvatarMonogram(entry.avatarKey, entry.nickname)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-light text-text-primary">{entry.nickname}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="font-cinzel text-xl text-text-primary">{entry.totalPoints}</span>
        <span className="ml-1.5 text-[9px] uppercase tracking-[0.2em] text-text-secondary/45">
          XP
        </span>
      </div>
    </motion.div>
  );
}
