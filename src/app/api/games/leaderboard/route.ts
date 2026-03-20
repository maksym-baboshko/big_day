import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, handleGameApiError } from "@/shared/lib/server";
import {
  getGameLeaderboard,
  requireAuthenticatedGameUser,
} from "@/features/game-session/server";
import { GAME_SLUG_ENUM } from "@/shared/config";

export const runtime = "nodejs";

const leaderboardQuerySchema = z.object({
  game: z.enum(GAME_SLUG_ENUM),
  topLimit: z.coerce.number().int().min(1).max(10).optional(),
  radius: z.coerce.number().int().min(1).max(3).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.leaderboard.read",
      limit: 60,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const { searchParams } = new URL(request.url);
    const result = leaderboardQuerySchema.safeParse({
      game: searchParams.get("game"),
      topLimit: searchParams.get("topLimit") ?? undefined,
      radius: searchParams.get("radius") ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid leaderboard query.", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    const leaderboard = await getGameLeaderboard({
      gameSlug: result.data.game,
      playerId: user.id,
      topLimit: result.data.topLimit ?? 5,
      windowRadius: result.data.radius ?? 2,
    });

    return NextResponse.json(
      { leaderboard },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return handleGameApiError(error, "Failed to read game leaderboard.");
  }
}
