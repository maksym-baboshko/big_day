import { after, NextResponse } from "next/server";
import {
  createInvalidDataErrorResponse,
  enforceRateLimit,
  getRequestId,
  handleGameApiError,
  runDeferredTasks,
} from "@/shared/lib/server";
import {
  parseRoundId,
  wheelResolutionPayloadSchema,
} from "@/features/game-session/api-contracts";
import {
  requireAuthenticatedGameUser,
  resolveWheelRound,
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
      scope: "games.wheel.resolve",
      limit: 90,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const { roundId: rawRoundId } = await context.params;
    const roundId = parseRoundId(rawRoundId);
    const body = await request.json().catch(() => null);
    const result = wheelResolutionPayloadSchema.safeParse(body);

    if (!result.success || !roundId) {
      return createInvalidDataErrorResponse(
        "Invalid wheel resolution payload.",
        requestId
      );
    }

    const { deferredTasks, ...resolution } = await resolveWheelRound({
      playerId: user.id,
      roundId,
      locale: result.data.locale,
      resolution: result.data.resolution,
      responseText: result.data.responseText ?? null,
    });
    after(() => runDeferredTasks(deferredTasks ?? []));
    return NextResponse.json(resolution);
  } catch (error) {
    return handleGameApiError(error, "Failed to resolve wheel round.", {
      requestId,
      scope: "api.games.wheel.resolve",
    });
  }
}
