"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { LiveFeedEventSnapshot, LivePageApiResponse } from "@/features/game-session";
import { getSupabaseBrowserClient } from "@/features/game-session";
const HERO_EVENT_DURATION_MS = 5000;
const LIVE_POLL_INTERVAL_MS = 30_000;
const LIVE_SNAPSHOT_URL = "/api/live";
const LIVE_PROJECTOR_BROADCAST_CHANNEL = "live-projector-broadcast";
const LIVE_PROJECTOR_BROADCAST_EVENT = "snapshot";
const SEEN_HERO_IDS_MAX = 200;

interface UseLiveProjectorSnapshotResult {
  snapshot: LivePageApiResponse | null;
  isLoading: boolean;
  error: boolean;
  heroEvent: LiveFeedEventSnapshot | null;
}

export function useLiveProjectorSnapshot(): UseLiveProjectorSnapshotResult {
  const [snapshot, setSnapshot] = useState<LivePageApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heroEvent, setHeroEvent] = useState<LiveFeedEventSnapshot | null>(null);
  const heroTimeoutRef = useRef<number | null>(null);
  const heroQueueRef = useRef<LiveFeedEventSnapshot[]>([]);
  const pollIntervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const activeHeroEventIdRef = useRef<string | null>(null);
  const seenHeroEventIdsRef = useRef(new Set<string>());
  const seenHeroEventIdsOrderRef = useRef<string[]>([]);
  const hasLoadedOnceRef = useRef(false);

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
    (nextHeroEvents: LiveFeedEventSnapshot[]) => {
      if (nextHeroEvents.length === 0) {
        return;
      }

      const queuedHeroIds = new Set(heroQueueRef.current.map((event) => event.id));
      const uniqueHeroEvents = nextHeroEvents.filter(
        (event) =>
          event.id !== activeHeroEventIdRef.current && !queuedHeroIds.has(event.id)
      );

      if (uniqueHeroEvents.length === 0) {
        return;
      }

      heroQueueRef.current.push(...uniqueHeroEvents);

      if (!activeHeroEventIdRef.current) {
        showNextHeroEvent();
      }
    },
    [showNextHeroEvent]
  );

  function trackSeenHeroEventId(id: string) {
    seenHeroEventIdsRef.current.add(id);
    seenHeroEventIdsOrderRef.current.push(id);

    while (seenHeroEventIdsOrderRef.current.length > SEEN_HERO_IDS_MAX) {
      const oldest = seenHeroEventIdsOrderRef.current.shift();
      if (oldest) {
        seenHeroEventIdsRef.current.delete(oldest);
      }
    }
  }

  const applySnapshot = useCallback(
    (nextSnapshot: LivePageApiResponse) => {
      const nextHeroEvents = nextSnapshot.feed.filter((event) => event.isHeroEvent);

      startTransition(() => {
        setSnapshot(nextSnapshot);
        setError(false);
        setIsLoading(false);
      });

      if (hasLoadedOnceRef.current) {
        const unseenHeroEvents = nextHeroEvents.filter((event) => {
          if (seenHeroEventIdsRef.current.has(event.id)) {
            return false;
          }

          trackSeenHeroEventId(event.id);
          return true;
        });

        queueHeroEvents([...unseenHeroEvents].reverse());
      } else {
        nextHeroEvents.forEach((event) => {
          trackSeenHeroEventId(event.id);
        });
      }

      hasLoadedOnceRef.current = true;
    },
    [queueHeroEvents]
  );

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
      applySnapshot(nextSnapshot);
    } catch {
      setError(true);
      setIsLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [applySnapshot]);

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

      heroQueueRef.current = [];

      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadSnapshot]);

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();

      const broadcastChannel = supabase
        .channel(LIVE_PROJECTOR_BROADCAST_CHANNEL)
        .on(
          "broadcast",
          { event: LIVE_PROJECTOR_BROADCAST_EVENT },
          (event: { payload: LivePageApiResponse }) => {
            applySnapshot(event.payload);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void loadSnapshot();
          }
        });

      return () => {
        void supabase.removeChannel(broadcastChannel);
      };
    } catch {
      return undefined;
    }
  }, [loadSnapshot, applySnapshot]);

  return {
    snapshot,
    isLoading,
    error,
    heroEvent,
  };
}
