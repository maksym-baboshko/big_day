"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { LiveFeedEventSnapshot, LivePageApiResponse } from "@/features/game-session";
import { getSupabaseBrowserClient } from "@/features/game-session";
import type { SupportedLocale } from "@/shared/config";

const HERO_EVENT_DURATION_MS = 5000;
const LIVE_POLL_INTERVAL_MS = 2000;
const LIVE_SNAPSHOT_URL = "/api/live";

interface UseLiveProjectorSnapshotResult {
  snapshot: LivePageApiResponse | null;
  isLoading: boolean;
  error: boolean;
  heroEvent: LiveFeedEventSnapshot | null;
}

export function useLiveProjectorSnapshot(
  locale: SupportedLocale
): UseLiveProjectorSnapshotResult {
  const [snapshot, setSnapshot] = useState<LivePageApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heroEvent, setHeroEvent] = useState<LiveFeedEventSnapshot | null>(null);
  const heroTimeoutRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const lastSeenFeedIdRef = useRef<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const queueHeroEvent = useCallback((nextHeroEvent: LiveFeedEventSnapshot) => {
    setHeroEvent(nextHeroEvent);
    if (heroTimeoutRef.current) {
      window.clearTimeout(heroTimeoutRef.current);
    }

    heroTimeoutRef.current = window.setTimeout(() => {
      setHeroEvent(null);
      heroTimeoutRef.current = null;
    }, HERO_EVENT_DURATION_MS);
  }, []);

  const loadSnapshot = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const searchParams = new URLSearchParams({
        leaderboardLimit: "10",
        feedLimit: "5",
        ts: Date.now().toString(),
      });

      const response = await fetch(`${LIVE_SNAPSHOT_URL}?${searchParams.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setError(true);
        setIsLoading(false);
        return;
      }

      const nextSnapshot = (await response.json()) as LivePageApiResponse;
      const latestFeedEvent = nextSnapshot.feed[0] ?? null;

      startTransition(() => {
        setSnapshot(nextSnapshot);
        setError(false);
        setIsLoading(false);
      });

      if (
        hasLoadedOnceRef.current &&
        latestFeedEvent?.isHeroEvent &&
        latestFeedEvent.id !== lastSeenFeedIdRef.current
      ) {
        queueHeroEvent(latestFeedEvent);
      }

      lastSeenFeedIdRef.current = latestFeedEvent?.id ?? null;
      hasLoadedOnceRef.current = true;
    } catch {
      setError(true);
      setIsLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [queueHeroEvent]);

  useEffect(() => {
    void loadSnapshot();

    pollIntervalRef.current = window.setInterval(() => {
      void loadSnapshot();
    }, LIVE_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadSnapshot();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (heroTimeoutRef.current) {
        window.clearTimeout(heroTimeoutRef.current);
      }

      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadSnapshot]);

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      const channel = supabase
        .channel(`live-projector-${locale}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "realtime_signals",
            filter: "channel=eq.live-projector",
          },
          () => {
            void loadSnapshot();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void loadSnapshot();
          }
        });

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
  }, [locale, loadSnapshot]);

  return {
    snapshot,
    isLoading,
    error,
    heroEvent,
  };
}
