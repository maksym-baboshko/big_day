"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useLocale } from "next-intl";
import type { SupportedLocale } from "@/shared/config";
import {
  getGameAuthAccessToken,
  signOutGameAuth,
  SupabaseBrowserConfigurationError,
} from "./auth-client";
import {
  clearStoredPlayerSession,
  getPlayerSessionSnapshot,
  getServerPlayerSessionSnapshot,
  subscribeToPlayerSession,
  writeStoredPlayerSession,
} from "./storage";
import type {
  GameApiErrorCode,
  PlayerApiResponse,
  PlayerSessionSnapshot,
} from "./types";

interface ApiErrorPayload {
  code?: GameApiErrorCode;
}

function getMountedSnapshot() {
  return true;
}

function getServerMountedSnapshot() {
  return false;
}

async function readApiErrorCode(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.code ?? "PERSISTENCE_ERROR";
  } catch {
    return "PERSISTENCE_ERROR";
  }
}

async function fetchPlayerSnapshot(
  accessToken: string,
  locale: SupportedLocale
) {
  const response = await fetch(
    `/api/games/player?locale=${encodeURIComponent(locale)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return {
      player: null,
      status: response.status,
      errorCode: await readApiErrorCode(response),
    };
  }

  const payload = (await response.json()) as PlayerApiResponse;
  return { player: payload.player, status: response.status, errorCode: null };
}

async function savePlayerSession(
  accessToken: string,
  nickname: string,
  locale: SupportedLocale
) {
  const response = await fetch("/api/games/player", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ nickname, locale }),
  });

  if (!response.ok) {
    return {
      player: null,
      status: response.status,
      errorCode: await readApiErrorCode(response),
    };
  }

  const payload = (await response.json()) as PlayerApiResponse;
  return { player: payload.player, status: response.status, errorCode: null };
}

export function usePlayerSession() {
  const locale = useLocale() as SupportedLocale;
  const mounted = useSyncExternalStore(
    () => () => {},
    getMountedSnapshot,
    getServerMountedSnapshot
  );
  const session = useSyncExternalStore(
    subscribeToPlayerSession,
    getPlayerSessionSnapshot,
    getServerPlayerSessionSnapshot
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [errorCode, setErrorCode] = useState<GameApiErrorCode | null>(null);

  function applySnapshot(nextSession: PlayerSessionSnapshot) {
    writeStoredPlayerSession(nextSession);
    setErrorCode(null);
  }

  function clearSnapshot() {
    clearStoredPlayerSession();
    setErrorCode(null);
  }

  const bootstrapPlayerSession = useCallback(async () => {
    setIsBootstrapping(true);

    try {
      const accessToken = await getGameAuthAccessToken();
      const response = await fetchPlayerSnapshot(accessToken, locale);

      if (response.player) {
        applySnapshot(response.player);
      } else {
        clearSnapshot();
      }

      if (response.errorCode) {
        setErrorCode(response.errorCode);
      }
    } catch (error) {
      if (error instanceof SupabaseBrowserConfigurationError) {
        setErrorCode("SUPABASE_NOT_CONFIGURED");
      } else {
        setErrorCode("PERSISTENCE_ERROR");
      }
    } finally {
      setIsBootstrapping(false);
    }
  }, [locale]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    void bootstrapPlayerSession();
  }, [bootstrapPlayerSession, locale, mounted]);

  async function registerPlayer(nickname: string) {
    setIsSaving(true);
    setErrorCode(null);

    try {
      const accessToken = await getGameAuthAccessToken();
      const response = await savePlayerSession(accessToken, nickname, locale);

      if (!response.player) {
        setErrorCode(response.errorCode);
        setIsSaving(false);
        return null;
      }

      applySnapshot(response.player);
      setIsSaving(false);
      return response.player;
    } catch (error) {
      if (error instanceof SupabaseBrowserConfigurationError) {
        setErrorCode("SUPABASE_NOT_CONFIGURED");
      } else {
        setErrorCode("PERSISTENCE_ERROR");
      }
      setIsSaving(false);
      return null;
    }
  }

  async function clearPlayer() {
    clearSnapshot();
    setIsSaving(true);

    try {
      await signOutGameAuth();
      await bootstrapPlayerSession();
    } catch (error) {
      if (error instanceof SupabaseBrowserConfigurationError) {
        setErrorCode("SUPABASE_NOT_CONFIGURED");
      } else {
        setErrorCode("PERSISTENCE_ERROR");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function updatePlayerSnapshot(nextSession: PlayerSessionSnapshot) {
    applySnapshot(nextSession);
  }

  return {
    session,
    isHydrating: !mounted || isBootstrapping,
    isSaving,
    errorCode,
    registerPlayer,
    clearPlayer,
    updatePlayerSnapshot,
  };
}
