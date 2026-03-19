import { after, NextResponse } from "next/server";
import { z } from "zod";
import type { SupportedLocale } from "@/shared/config";
import {
  enforceRateLimit,
  handleGameApiError,
  runDeferredTasks,
} from "@/shared/lib/server";
import {
  requireAuthenticatedGameUser,
  startWheelRoundTimer,
} from "@/features/game-session/server";

export const runtime = "nodejs";

const wheelTimerStartSchema = z.object({
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
      scope: "games.wheel.timer.start",
      limit: 90,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const { roundId } = await context.params;
    const body = await request.json();
    const result = wheelTimerStartSchema.safeParse(body);

    if (!result.success || !roundId) {
      return NextResponse.json(
        { error: "Invalid wheel timer payload.", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    const { deferredTasks, ...timerStart } = await startWheelRoundTimer({
      playerId: user.id,
      roundId,
      locale: result.data.locale as SupportedLocale,
    });
    after(() => runDeferredTasks(deferredTasks ?? []));
    return NextResponse.json(timerStart);
  } catch (error) {
    return handleGameApiError(error, "Failed to start wheel timer.");
  }
}
