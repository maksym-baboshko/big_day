"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getSupabaseBrowserClient,
  getGameAuthAccessToken,
  type GameLeaderboardApiResponse,
  type LeaderboardEntrySnapshot,
} from "@/features/game-session";
import { cn } from "@/shared/lib";
import { getAvatarMonogram } from "./wheel-helpers";

export function WheelLeaderboardCard() {
  const t = useTranslations("WheelOfFortune");
  const tCommon = useTranslations("GamesCommon");
  const [leaderboard, setLeaderboard] =
    useState<GameLeaderboardApiResponse["leaderboard"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadLeaderboard = useEffectEvent(async () => {
    try {
      const accessToken = await getGameAuthAccessToken();
      const response = await fetch(
        "/api/games/leaderboard?game=wheel-of-fortune&topLimit=5&radius=2",
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as GameLeaderboardApiResponse;

      startTransition(() => {
        setLeaderboard(payload.leaderboard);
        setHasError(false);
        setIsLoading(false);
      });
    } catch {
      setHasError(true);
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      const channel = supabase
        .channel("wheel-leaderboard")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "realtime_signals",
            filter: "channel=eq.game-leaderboard",
          },
          (payload) => {
            const nextRecord =
              payload.new && typeof payload.new === "object"
                ? (payload.new as { game_slug?: string | null })
                : null;

            if (
              nextRecord?.game_slug &&
              nextRecord.game_slug !== "wheel-of-fortune"
            ) {
              return;
            }

            void loadLeaderboard();
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
  }, []);

  const currentPlayerId = leaderboard?.currentPlayerId ?? null;
  const playerEntry = leaderboard?.playerEntry ?? null;
  const showPlayerWindow =
    Boolean(playerEntry) &&
    Boolean(leaderboard?.playerWindow.length) &&
    (playerEntry?.rank ?? 0) > (leaderboard?.top.length ?? 0);

  function renderRow(entry: LeaderboardEntrySnapshot) {
    const isCurrentPlayer = entry.playerId === currentPlayerId;

    return (
      <div
        key={entry.playerId}
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3",
          isCurrentPlayer
            ? "border-accent/20 bg-accent/10"
            : "border-accent/8 bg-bg-primary/40"
        )}
      >
        <div className="w-7 shrink-0 text-center font-cinzel text-lg text-accent">
          {entry.rank}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/18 bg-accent/8 font-cinzel text-xs tracking-[0.16em] text-accent">
          {getAvatarMonogram(entry.avatarKey, entry.nickname)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text-primary">
            {entry.nickname}
            {isCurrentPlayer ? (
              <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-accent">
                {t("leaderboard_you")}
              </span>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-cinzel text-xl text-text-primary">{entry.totalPoints}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-text-secondary/50">
            {tCommon("points_unit")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-accent/10 bg-bg-primary/40 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">
          {t("leaderboard_label")}
        </p>
        <span className="h-px flex-1 bg-linear-to-r from-accent/20 to-transparent" />
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl border border-accent/8 bg-bg-primary/30"
            />
          ))}
        </div>
      ) : hasError ? (
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {t("leaderboard_error")}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary/55">
              {t("leaderboard_top_label")}
            </p>
            {leaderboard?.top.length ? (
              <div className="mt-3 space-y-2">{leaderboard.top.map(renderRow)}</div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {t("leaderboard_empty")}
              </p>
            )}
          </div>

          {playerEntry ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary/55">
                {t("leaderboard_window_label")}
              </p>
              <div className="mt-3 rounded-2xl border border-accent/10 bg-bg-primary/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-accent/80">
                  {t("leaderboard_rank_label")}
                </p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <p className="font-cinzel text-3xl text-text-primary">
                    #{playerEntry.rank}
                  </p>
                  <p className="font-cinzel text-2xl text-accent">
                    {playerEntry.totalPoints}
                  </p>
                </div>
              </div>

              {showPlayerWindow ? (
                <div className="mt-3 space-y-2">
                  {leaderboard?.playerWindow.map(renderRow)}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-text-secondary">
              {t("leaderboard_unranked")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
