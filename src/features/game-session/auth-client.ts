"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseBrowserConfigurationError extends Error {
  constructor() {
    super("Supabase browser auth is not configured.");
    this.name = "SupabaseBrowserConfigurationError";
  }
}

let browserClient: SupabaseClient | null = null;

function getSupabaseBrowserConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    null;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null;

  if (!url || !publishableKey) {
    throw new SupabaseBrowserConfigurationError();
  }

  return { url, publishableKey };
}

/**
 * Removes a Supabase session from localStorage if its access token is already
 * expired. When the SDK finds an expired session it immediately calls
 * _callRefreshToken() during createClient(), which logs an AuthApiError if
 * the refresh token is no longer valid (e.g. after a project reset or token
 * rotation). Clearing the entry before createClient() prevents that network
 * round-trip and the resulting console.error / Next.js dev overlay noise.
 *
 * Only the access-token expiry is checked here (no network call). If the
 * refresh token is invalidated server-side but the access token is still
 * within its window, getGameAuthAccessToken() handles it via getUser().
 */
function pruneExpiredSessionFromStorage(supabaseUrl: string) {
  if (typeof window === "undefined") return;

  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const key = `sb-${projectRef}-auth-token`;
    const raw = localStorage.getItem(key);

    if (!raw) return;

    const parsed = JSON.parse(raw) as { expires_at?: number };

    if (
      typeof parsed.expires_at === "number" &&
      Date.now() / 1000 >= parsed.expires_at
    ) {
      localStorage.removeItem(key);
    }
  } catch {
    // Any storage or parse error is safe to ignore — createClient() proceeds
    // normally and getGameAuthAccessToken() handles stale sessions via getUser().
  }
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = getSupabaseBrowserConfig();

  // Clear expired sessions before the SDK can attempt a doomed refresh.
  pruneExpiredSessionFromStorage(url);

  browserClient = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return browserClient;
}

async function signInAnonymously(supabase: SupabaseClient) {
  const {
    data: { session },
    error,
  } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!session?.access_token) {
    throw new Error("Anonymous auth session is missing.");
  }

  return session.access_token;
}

export async function getGameAuthAccessToken() {
  const supabase = getSupabaseBrowserClient();

  let accessToken: string | null = null;

  try {
    const { data, error } = await supabase.auth.getSession();

    // AuthApiError from getSession() means the stored refresh token is
    // invalid (e.g. project reset, token rotated). Clear it and re-auth.
    if (error) throw error;

    accessToken = data.session?.access_token ?? null;
  } catch {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return signInAnonymously(supabase);
  }

  if (accessToken) {
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (!userError && user) {
      return accessToken;
    }

    // Access token exists in storage but is not recognised by the server
    // (e.g. refresh token was rotated away since this tab was last open).
    await supabase.auth.signOut({ scope: "local" }).catch((e: unknown) => {
      console.warn("Failed to clear stale Supabase session:", e);
    });
  }

  return signInAnonymously(supabase);
}

export async function signOutGameAuth() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
