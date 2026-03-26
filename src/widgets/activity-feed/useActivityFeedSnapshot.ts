"use client";

import {
  SupabaseBrowserConfigurationError,
  getSupabaseBrowserClient,
} from "@/shared/lib/supabase-browser-client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import {
  HERO_EVENT_DURATION_MS,
  LIVE_POLL_INTERVAL_MS,
  SEEN_HERO_IDS_MAX,
  collectUnseenHeroEvents,
  filterQueueableHeroEvents,
  getRealtimeRetryDelay,
  shouldRetryRealtimeStatus,
} from "./activity-feed-helpers";
import type { ActivityFeedSnapshot, FeedEventSnapshot } from "./types";

const LIVE_SNAPSHOT_URL = "/api/activity-feed";
const LIVE_PROJECTOR_BROADCAST_CHANNEL = "live-projector-broadcast";
const LIVE_PROJECTOR_BROADCAST_EVENT = "snapshot";
const FEED_LIMIT = 20;
const LEADERBOARD_LIMIT = 30;

interface UseActivityFeedSnapshotResult {
  snapshot: ActivityFeedSnapshot | null;
  isLoading: boolean;
  error: boolean;
  heroEvent: FeedEventSnapshot | null;
}

export function useActivityFeedSnapshot(): UseActivityFeedSnapshotResult {
  const [snapshot, setSnapshot] = useState<ActivityFeedSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heroEvent, setHeroEvent] = useState<FeedEventSnapshot | null>(null);

  const heroTimeoutRef = useRef<number | null>(null);
  const heroQueueRef = useRef<FeedEventSnapshot[]>([]);
  const pollIntervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const activeHeroEventIdRef = useRef<string | null>(null);
  const seenHeroEventIdsRef = useRef(new Set<string>());
  const seenHeroEventIdsOrderRef = useRef<string[]>([]);
  const hasLoadedOnceRef = useRef(false);
  const supabaseClientRef = useRef<SupabaseClient | null>(null);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
  const realtimeRetryTimeoutRef = useRef<number | null>(null);
  const realtimeRetryAttemptRef = useRef(0);
  const subscribeToRealtimeRef = useRef<() => void>(() => {});

  const showNextHeroEvent = useCallback(() => {
    if (heroTimeoutRef.current) {
      window.clearTimeout(heroTimeoutRef.current);
    }

    const nextHeroEvent = heroQueueRef.current.shift() ?? null;
    activeHeroEventIdRef.current = nextHeroEvent?.id ?? null;
    setHeroEvent(nextHeroEvent);

    if (!nextHeroEvent) {
      heroTimeoutRef.current = null;
      return;
    }

    heroTimeoutRef.current = window.setTimeout(() => {
      showNextHeroEvent();
    }, HERO_EVENT_DURATION_MS);
  }, []);

  const queueHeroEvents = useCallback(
    (nextHeroEvents: FeedEventSnapshot[]) => {
      if (nextHeroEvents.length === 0) {
        return;
      }

      const queuedHeroIds = new Set(heroQueueRef.current.map((event) => event.id));
      const uniqueHeroEvents = filterQueueableHeroEvents(
        nextHeroEvents,
        activeHeroEventIdRef.current,
        queuedHeroIds,
      );

      if (uniqueHeroEvents.length === 0) {
        return;
      }

      heroQueueRef.current.push(...uniqueHeroEvents);

      if (!activeHeroEventIdRef.current) {
        showNextHeroEvent();
      }
    },
    [showNextHeroEvent],
  );

  const applySnapshot = useCallback(
    (nextSnapshot: ActivityFeedSnapshot) => {
      const nextHeroEvents = filterQueueableHeroEvents(nextSnapshot.feed);

      startTransition(() => {
        setSnapshot(nextSnapshot);
        setError(false);
        setIsLoading(false);
      });

      if (hasLoadedOnceRef.current) {
        const unseenHeroEvents = collectUnseenHeroEvents(
          nextHeroEvents,
          seenHeroEventIdsRef.current,
          seenHeroEventIdsOrderRef.current,
        );

        queueHeroEvents([...unseenHeroEvents].reverse());
      } else {
        collectUnseenHeroEvents(
          nextHeroEvents,
          seenHeroEventIdsRef.current,
          seenHeroEventIdsOrderRef.current,
          SEEN_HERO_IDS_MAX,
        );
      }

      hasLoadedOnceRef.current = true;
    },
    [queueHeroEvents],
  );

  const loadSnapshot = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const searchParams = new URLSearchParams({
        leaderboard_limit: LEADERBOARD_LIMIT.toString(),
        feed_limit: FEED_LIMIT.toString(),
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

      const nextSnapshot = (await response.json()) as ActivityFeedSnapshot;
      applySnapshot(nextSnapshot);
    } catch {
      setError(true);
      setIsLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [applySnapshot]);

  const clearRealtimeRetry = useCallback(() => {
    if (!realtimeRetryTimeoutRef.current) {
      return;
    }

    window.clearTimeout(realtimeRetryTimeoutRef.current);
    realtimeRetryTimeoutRef.current = null;
  }, []);

  const removeRealtimeChannel = useCallback(() => {
    const channel = broadcastChannelRef.current;
    const supabase = supabaseClientRef.current;
    broadcastChannelRef.current = null;

    if (!channel || !supabase) {
      return;
    }

    void supabase.removeChannel(channel);
  }, []);

  const scheduleRealtimeRetry = useCallback(() => {
    if (realtimeRetryTimeoutRef.current) {
      return;
    }

    realtimeRetryAttemptRef.current += 1;
    const retryDelay = getRealtimeRetryDelay(realtimeRetryAttemptRef.current);

    realtimeRetryTimeoutRef.current = window.setTimeout(() => {
      realtimeRetryTimeoutRef.current = null;
      subscribeToRealtimeRef.current();
    }, retryDelay);
  }, []);

  const subscribeToRealtime = useCallback(() => {
    try {
      const supabase = supabaseClientRef.current ?? getSupabaseBrowserClient();
      supabaseClientRef.current = supabase;
      removeRealtimeChannel();

      const broadcastChannel = supabase
        .channel(LIVE_PROJECTOR_BROADCAST_CHANNEL)
        .on(
          "broadcast",
          { event: LIVE_PROJECTOR_BROADCAST_EVENT },
          (message: { payload: ActivityFeedSnapshot }) => {
            applySnapshot(message.payload);
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            realtimeRetryAttemptRef.current = 0;
            clearRealtimeRetry();
            void loadSnapshot();
            return;
          }

          if (!shouldRetryRealtimeStatus(status)) {
            return;
          }

          removeRealtimeChannel();
          scheduleRealtimeRetry();
        });

      broadcastChannelRef.current = broadcastChannel;
    } catch (error) {
      if (error instanceof SupabaseBrowserConfigurationError) {
        return;
      }

      scheduleRealtimeRetry();
    }
  }, [
    applySnapshot,
    clearRealtimeRetry,
    loadSnapshot,
    removeRealtimeChannel,
    scheduleRealtimeRetry,
  ]);

  subscribeToRealtimeRef.current = subscribeToRealtime;

  useEffect(() => {
    void loadSnapshot();

    pollIntervalRef.current = window.setInterval(() => {
      void loadSnapshot();
    }, LIVE_POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadSnapshot();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (heroTimeoutRef.current) {
        window.clearTimeout(heroTimeoutRef.current);
      }

      heroQueueRef.current = [];

      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadSnapshot]);

  useEffect(() => {
    subscribeToRealtime();

    return () => {
      clearRealtimeRetry();
      removeRealtimeChannel();
    };
  }, [clearRealtimeRetry, removeRealtimeChannel, subscribeToRealtime]);

  return { snapshot, isLoading, error, heroEvent };
}
