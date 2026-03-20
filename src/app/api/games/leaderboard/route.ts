import { NextResponse } from "next/server";
import {
  createInvalidDataErrorResponse,
  enforceRateLimit,
  getRequestId,
  handleGameApiError,
} from "@/shared/lib/server";
import { leaderboardQuerySchema } from "@/features/game-session";
import {
  getGameLeaderboard,
  requireAuthenticatedGameUser,
} from "@/features/game-session/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

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
      return createInvalidDataErrorResponse(
        "Invalid leaderboard query.",
        requestId
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
    return handleGameApiError(error, "Failed to read game leaderboard.", {
      requestId,
      scope: "api.games.leaderboard.get",
    });
  }
}
