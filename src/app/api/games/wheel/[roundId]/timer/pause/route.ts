import { NextResponse } from "next/server";
import {
  createInvalidDataErrorResponse,
  enforceRateLimit,
  getRequestId,
  handleGameApiError,
} from "@/shared/lib/server";
import {
  parseRoundId,
  wheelTimerPayloadSchema,
} from "@/features/game-session/api-contracts";
import {
  pauseWheelRoundTimer,
  requireAuthenticatedGameUser,
} from "@/features/game-session/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ roundId: string }> }
) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.wheel.timer.pause",
      limit: 90,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const { roundId: rawRoundId } = await context.params;
    const roundId = parseRoundId(rawRoundId);
    const body = await request.json().catch(() => null);
    const result = wheelTimerPayloadSchema.safeParse(body);

    if (!result.success || !roundId) {
      return createInvalidDataErrorResponse(
        "Invalid wheel timer pause payload.",
        requestId
      );
    }

    const timerPause = await pauseWheelRoundTimer({
      playerId: user.id,
      roundId,
      locale: result.data.locale,
    });

    return NextResponse.json(timerPause);
  } catch (error) {
    return handleGameApiError(error, "Failed to pause wheel timer.", {
      requestId,
      scope: "api.games.wheel.timer.pause",
    });
  }
}
