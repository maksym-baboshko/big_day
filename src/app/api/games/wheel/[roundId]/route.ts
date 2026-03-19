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
  resolveWheelRound,
} from "@/features/game-session/server";

export const runtime = "nodejs";

const wheelResolutionSchema = z.object({
  locale: z.enum(["uk", "en"]),
  resolution: z.enum(["completed", "promised", "skipped"]),
  responseText: z.string().trim().max(300).optional().nullable(),
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

    const { deferredTasks, ...resolution } = await resolveWheelRound({
      playerId: user.id,
      roundId,
      locale: result.data.locale as SupportedLocale,
      resolution: result.data.resolution,
      responseText: result.data.responseText ?? null,
    });
    after(() => runDeferredTasks(deferredTasks ?? []));
    return NextResponse.json(resolution);
  } catch (error) {
    return handleGameApiError(error, "Failed to resolve wheel round.");
  }
}
