"use client";

import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { LeaderboardRow } from "./LeaderboardRow";
import type { LeaderboardEntrySnapshot } from "./types";

interface LeaderboardListProps {
  entries: LeaderboardEntrySnapshot[];
}

export function LeaderboardList({ entries }: LeaderboardListProps) {
  const t = useTranslations("ActivityFeedPage");

  return (
    <LeaderboardPanel eyebrow={t("leaderboard_label")} className="lg:flex-1">
      <div className="grid gap-3" data-testid="leaderboard-list">
        <AnimatePresence mode="popLayout" initial={false}>
          {entries.map((entry) => (
            <LeaderboardRow key={entry.playerId} entry={entry} isLeader={entry.rank === 1} />
          ))}
        </AnimatePresence>
      </div>
    </LeaderboardPanel>
  );
}
