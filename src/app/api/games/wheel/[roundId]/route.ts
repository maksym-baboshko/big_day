import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupportedLocale } from "@/shared/config";
import {
  enforceRateLimit,
  getRateLimitErrorPayload,
  RateLimitExceededError,
} from "@/shared/lib/server";
import {
  InvalidWheelRoundResponseError,
  InvalidWheelRoundStateError,
  PlayerProfileNotReadyError,
  requireAuthenticatedGameUser,
  resolveWheelRound,
  SupabaseConfigurationError,
  UnauthorizedGameRequestError,
  WheelRoundAlreadyResolvedError,
  WheelRoundNotFoundError,
} from "@/features/game-session/server";

export const runtime = "nodejs";

const wheelResolutionSchema = z.object({
  locale: z.enum(["uk", "en"]),
  resolution: z.enum(["completed", "promised", "skipped"]),
  responseText: z.string().trim().max(300).optional().nullable(),
  remainingSeconds: z.number().int().min(0).optional().nullable(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ roundId: string }> }
) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.wheel.resolve",
      limit: 90,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const { roundId } = await context.params;
    const body = await request.json();
    const result = wheelResolutionSchema.safeParse(body);

    if (!result.success || !roundId) {
      return NextResponse.json(
        { error: "Invalid wheel resolution payload.", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    const resolution = await resolveWheelRound({
      playerId: user.id,
      roundId,
      locale: result.data.locale as SupportedLocale,
      resolution: result.data.resolution,
      responseText: result.data.responseText ?? null,
      remainingSeconds: result.data.remainingSeconds ?? null,
    });

    return NextResponse.json(resolution);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        {
          error: "Supabase is not configured.",
          code: "SUPABASE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    if (error instanceof UnauthorizedGameRequestError) {
      return NextResponse.json(
        {
          error: "Unauthorized game request.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    if (error instanceof PlayerProfileNotReadyError) {
      return NextResponse.json(
        {
          error: "Player profile is not ready yet.",
          code: "PLAYER_NOT_FOUND",
        },
        { status: 409 }
      );
    }

    if (error instanceof WheelRoundNotFoundError) {
      return NextResponse.json(
        {
          error: "Wheel round was not found.",
          code: "ROUND_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (error instanceof WheelRoundAlreadyResolvedError) {
      return NextResponse.json(
        {
          error: "Wheel round is already resolved.",
          code: "ROUND_ALREADY_RESOLVED",
        },
        { status: 409 }
      );
    }

    if (error instanceof InvalidWheelRoundResponseError) {
      return NextResponse.json(
        {
          error: "Wheel round response is invalid.",
          code: "INVALID_DATA",
        },
        { status: 400 }
      );
    }

    if (error instanceof InvalidWheelRoundStateError) {
      return NextResponse.json(
        {
          error: "Wheel round state is invalid.",
          code: "INVALID_DATA",
        },
        { status: 409 }
      );
    }

    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        getRateLimitErrorPayload(error.retryAfterSeconds),
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
          },
        }
      );
    }

    console.error("Wheel resolution route error:", error);
    return NextResponse.json(
      { error: "Failed to resolve wheel round.", code: "PERSISTENCE_ERROR" },
      { status: 500 }
    );
  }
}
