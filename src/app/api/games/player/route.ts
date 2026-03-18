import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceRateLimit,
  getRateLimitErrorPayload,
  RateLimitExceededError,
} from "@/shared/lib/server";
import {
  bootstrapPlayerProfile,
  savePlayerProfile,
  requireAuthenticatedGameUser,
  SupabaseConfigurationError,
  UnauthorizedGameRequestError,
} from "@/features/game-session/server";

export const runtime = "nodejs";

const playerPayloadSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((value) => value.replace(/\s+/g, " ")),
  locale: z.enum(["uk", "en"]).default("uk"),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    const { searchParams } = new URL(request.url);
    const locale = z.enum(["uk", "en"]).catch("uk").parse(searchParams.get("locale"));
    const player = await bootstrapPlayerProfile({
      authUserId: user.id,
      locale,
    });

    return NextResponse.json({ player });
  } catch (error) {
    if (error instanceof UnauthorizedGameRequestError) {
      return NextResponse.json(
        { error: "Unauthorized game request.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        {
          error: "Supabase is not configured.",
          code: "SUPABASE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    console.error("Games player GET error:", error);
    return NextResponse.json(
      { error: "Failed to read player session.", code: "PERSISTENCE_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.player.save",
      limit: 20,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const body = await request.json();
    const result = playerPayloadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid player payload.", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    const player = await savePlayerProfile({
      authUserId: user.id,
      nickname: result.data.nickname,
      locale: result.data.locale,
    });
    return NextResponse.json({ player });
  } catch (error) {
    if (error instanceof UnauthorizedGameRequestError) {
      return NextResponse.json(
        { error: "Unauthorized game request.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        {
          error: "Supabase is not configured.",
          code: "SUPABASE_NOT_CONFIGURED",
        },
        { status: 503 }
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

    console.error("Games player POST error:", error);
    return NextResponse.json(
      { error: "Failed to save player session.", code: "PERSISTENCE_ERROR" },
      { status: 500 }
    );
  }
}
