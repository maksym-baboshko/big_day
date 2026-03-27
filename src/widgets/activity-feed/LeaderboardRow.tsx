"use client";

import { cn } from "@/shared/lib";
import { SurfacePanel } from "@/shared/ui";
import { motion } from "motion/react";
import { getAvatarMonogram } from "./activity-feed-helpers";
import type { LeaderboardEntrySnapshot } from "./types";

interface LeaderboardRowProps {
  entry: LeaderboardEntrySnapshot;
  isLeader: boolean;
}

export function LeaderboardRow({ entry, isLeader }: LeaderboardRowProps) {
  if (isLeader) {
    return (
      <SurfacePanel
        tone="highlighted"
        data-testid="leaderboard-row"
        data-rank={entry.rank}
        className="relative"
        contentClassName="px-5 py-4"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/65 to-transparent" />

        <motion.div layout className="flex items-center gap-4">
          <div className="font-cinzel text-4xl leading-none text-accent">1</div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent/32 bg-accent/12 font-cinzel text-sm tracking-[0.14em] text-accent">
            {getAvatarMonogram(entry.avatarKey, entry.nickname)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-normal leading-tight text-text-primary">
              {entry.nickname}
            </p>
          </div>
          <div className="flex shrink-0 items-baseline gap-1.5">
            <span className="font-cinzel text-3xl leading-none text-accent">
              {entry.totalPoints}
            </span>
            <span className="font-cinzel text-[9px] uppercase tracking-[0.22em] text-text-secondary/50">
              XP
            </span>
          </div>
        </motion.div>
      </SurfacePanel>
    );
  }

  return (
    <SurfacePanel
      tone="subtle"
      data-testid="leaderboard-row"
      data-rank={entry.rank}
      className={cn(entry.rank === 2 || entry.rank === 3 ? "bg-accent/6" : "bg-bg-secondary/30")}
      contentClassName="px-4 py-3"
    >
      <motion.div layout className="flex items-center gap-3">
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
    </SurfacePanel>
  );
}
