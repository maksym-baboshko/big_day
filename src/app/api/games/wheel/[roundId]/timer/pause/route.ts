import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupportedLocale } from "@/shared/config";
import { enforceRateLimit, handleGameApiError } from "@/shared/lib/server";
import {
  pauseWheelRoundTimer,
  requireAuthenticatedGameUser,
} from "@/features/game-session/server";

export const runtime = "nodejs";

const wheelTimerPauseSchema = z.object({
  locale: z.enum(["uk", "en"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ roundId: string }> }
) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.wheel.timer.pause",
      limit: 90,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const { roundId } = await context.params;
    const body = await request.json();
    const result = wheelTimerPauseSchema.safeParse(body);

    if (!result.success || !roundId) {
      return NextResponse.json(
        { error: "Invalid wheel timer pause payload.", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    const timerPause = await pauseWheelRoundTimer({
      playerId: user.id,
      roundId,
      locale: result.data.locale as SupportedLocale,
    });

    return NextResponse.json(timerPause);
  } catch (error) {
    return handleGameApiError(error, "Failed to pause wheel timer.");
  }
}
