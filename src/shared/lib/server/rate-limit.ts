import "server-only";

import { getSupabaseAdminClient } from "@/features/game-session/server/supabase";

export class RateLimitExceededError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests.");
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function getRateLimitErrorPayload(retryAfterSeconds: number) {
  return {
    error: "Too many requests.",
    code: "RATE_LIMITED" as const,
    retryAfterSeconds,
  };
}

interface RateLimitResult {
  allowed: boolean;
  current_count: number;
  remaining: number;
  retry_after_seconds: number;
}

interface EnforceRateLimitOptions {
  request: Request;
  scope: string;
  limit: number;
  windowSeconds: number;
  authUserId?: string | null;
}

export function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp?.trim()) {
    return cloudflareIp.trim();
  }

  return "unknown";
}

function getRateLimitIdentifier(
  request: Request,
  authUserId?: string | null
) {
  if (authUserId) {
    return `user:${authUserId}`;
  }

  return `ip:${getRequestIpAddress(request)}`;
}

export async function enforceRateLimit({
  request,
  scope,
  limit,
  windowSeconds,
  authUserId = null,
}: EnforceRateLimitOptions) {
  const supabase = getSupabaseAdminClient();
  const identifier = getRateLimitIdentifier(request, authUserId);
  const { data, error } = await supabase
    .rpc("consume_rate_limit_window", {
      p_scope: scope,
      p_identifier: identifier,
      p_limit: limit,
      p_window_seconds: windowSeconds,
      p_now: new Date().toISOString(),
    })
    .single();

  if (error) {
    throw error;
  }

  const result = data as RateLimitResult | null;

  if (!result) {
    throw new Error("Rate limit function did not return a result.");
  }

  if (!result.allowed) {
    throw new RateLimitExceededError(result.retry_after_seconds);
  }
}
