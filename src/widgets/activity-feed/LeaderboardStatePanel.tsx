"use client";

import { useTranslations } from "next-intl";
import { LeaderboardEmptyState } from "./LeaderboardEmptyState";
import { LeaderboardPanel } from "./LeaderboardPanel";

interface LeaderboardStatePanelProps {
  variant?: "loading" | "error";
}

export function LeaderboardStatePanel({ variant = "loading" }: LeaderboardStatePanelProps) {
  const t = useTranslations("ActivityFeedPage");

  return (
    <LeaderboardPanel eyebrow={t("leaderboard_label")} className="lg:flex-1">
      <LeaderboardEmptyState variant={variant} />
    </LeaderboardPanel>
  );
}
