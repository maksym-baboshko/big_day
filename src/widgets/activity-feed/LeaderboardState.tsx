"use client";

import { LeaderboardStatePanel } from "./LeaderboardStatePanel";

interface LeaderboardStateProps {
  variant?: "loading" | "error";
}

export function LeaderboardState({ variant = "loading" }: LeaderboardStateProps) {
  return <LeaderboardStatePanel variant={variant} />;
}
