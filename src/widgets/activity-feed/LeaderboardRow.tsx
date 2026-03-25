"use client";

import { motion } from "motion/react";
import { getAvatarMonogram } from "./activity-feed-helpers";
import type { LeaderboardEntrySnapshot } from "./types";

interface LeaderboardRowProps {
  entry: LeaderboardEntrySnapshot;
  isLeader: boolean;
}

export function LeaderboardRow({ entry, isLeader }: LeaderboardRowProps) {
  const monogram = getAvatarMonogram(entry.avatarKey, entry.nickname);

  if (isLeader) {
    return (
      <motion.div
        layout
        className="relative overflow-hidden rounded-3xl border border-accent/18 bg-accent/7 p-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.35 }}
      >
        {/* Top gradient line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/50 to-transparent" />

        <div className="flex items-center gap-4">
          {/* Rank */}
          <div className="font-cinzel w-10 shrink-0 text-center text-4xl font-bold text-accent/70">
            {entry.rank}
          </div>
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/15 font-cinzel text-base font-bold text-accent">
            {monogram}
          </div>
          {/* Nickname */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold text-text-primary">{entry.nickname}</p>
          </div>
          {/* Points */}
          <div className="font-cinzel shrink-0 text-3xl font-bold text-accent">
            {entry.totalPoints}
          </div>
        </div>
      </motion.div>
    );
  }

  const isTopThree = entry.rank <= 3;

  return (
    <motion.div
      layout
      className={`relative overflow-hidden rounded-3xl border bg-bg-secondary/30 px-4 py-3 ${isTopThree ? "border-accent/14" : "border-accent/8"}`}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="font-cinzel w-7 shrink-0 text-center text-sm text-accent/50">
          {entry.rank}
        </div>
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 font-cinzel text-xs font-bold text-accent">
          {monogram}
        </div>
        {/* Nickname */}
        <p className="min-w-0 flex-1 truncate text-[18px] font-light text-text-primary">
          {entry.nickname}
        </p>
        {/* Points */}
        <div className="font-cinzel shrink-0 text-xl font-bold text-accent/80">
          {entry.totalPoints}
        </div>
      </div>
    </motion.div>
  );
}
