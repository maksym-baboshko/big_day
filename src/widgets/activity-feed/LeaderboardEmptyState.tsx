"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

const REGULAR_ROWS = [
  { rank: 2, nameW: "64%", delay: 0.2, mobileHidden: false },
  { rank: 3, nameW: "55%", delay: 0.4, mobileHidden: false },
  { rank: 4, nameW: "48%", delay: 0.6, mobileHidden: false },
  { rank: 5, nameW: "42%", delay: 0.8, mobileHidden: false },
  { rank: 6, nameW: "55%", delay: 1.0, mobileHidden: false },
  { rank: 7, nameW: "48%", delay: 1.2, mobileHidden: true },
  { rank: 8, nameW: "44%", delay: 1.4, mobileHidden: true },
  { rank: 9, nameW: "38%", delay: 1.6, mobileHidden: true },
  { rank: 10, nameW: "33%", delay: 1.8, mobileHidden: true },
  { rank: 11, nameW: "28%", delay: 2.0, mobileHidden: true },
  { rank: 12, nameW: "24%", delay: 2.2, mobileHidden: true },
] as const;

interface LeaderboardEmptyStateProps {
  variant?: "loading" | "error";
}

export function LeaderboardEmptyState({ variant = "loading" }: LeaderboardEmptyStateProps) {
  const t = useTranslations("ActivityFeedPage");
  const isError = variant === "error";

  return (
    <div
      data-testid={
        isError ? "live-leaderboard-state-error-shell" : "live-leaderboard-state-skeleton"
      }
      className="flex min-h-[400px] flex-col lg:min-h-0 lg:flex-1"
    >
      {isError ? (
        // Offline banner shown above the dimmed skeleton
        <div
          data-testid="live-leaderboard-state-error"
          className="mb-2 flex items-center justify-center gap-2 rounded-2xl border border-accent/10 bg-bg-secondary/40 px-4 py-2.5 text-xs text-text-secondary/50"
        >
          <WifiOff size={12} strokeWidth={1.5} aria-hidden="true" />
          <span>{t("leaderboard_error")}</span>
        </div>
      ) : null}

      {/* Skeleton rows — animated when loading, frozen/dim when error */}
      <div className={`flex flex-col gap-2 ${isError ? "opacity-25" : ""}`}>
        <div
          className={`relative overflow-hidden rounded-3xl border border-accent/18 bg-accent/7 px-5 py-4 ${isError ? "" : "af-leader-pulse"}`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />
          {isError ? null : (
            <div className="af-shimmer absolute inset-0 bg-linear-to-r from-transparent via-accent/8 to-transparent" />
          )}
          <div className="relative flex items-center gap-4">
            <div className="font-cinzel text-4xl leading-none text-accent/35">1</div>
            <div className="h-12 w-12 shrink-0 rounded-full border-2 border-accent/18 bg-accent/10" />
            <div className="flex-1">
              <div className="h-2.5 w-28 rounded-full bg-accent/18" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="h-6 w-9 rounded bg-accent/18" />
              <div className="h-1.5 w-4 rounded-full bg-accent/10" />
            </div>
          </div>
        </div>

        {REGULAR_ROWS.map(({ rank, nameW, delay, mobileHidden }) => (
          <div
            key={rank}
            className={`flex items-center gap-3 rounded-2xl border border-accent/18 bg-bg-secondary/40 px-4 py-3 backdrop-blur-sm${mobileHidden ? " hidden lg:flex" : ""}${isError ? "" : " af-regular-pulse"}`}
            style={isError ? undefined : { animationDelay: `-${delay}s` }}
          >
            <div className="w-6 shrink-0 text-center font-cinzel text-base text-accent/50">
              {rank}
            </div>
            <div className="h-9 w-9 shrink-0 rounded-full border border-accent/20 bg-accent/14" />
            <div className="flex-1">
              <div className="h-2 rounded-full bg-text-secondary/22" style={{ width: nameW }} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="h-4 w-8 shrink-0 rounded bg-accent/18" />
              <div className="h-1.5 w-4 shrink-0 rounded-full bg-accent/12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
