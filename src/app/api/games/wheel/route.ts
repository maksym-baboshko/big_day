import { NextResponse } from "next/server";
import {
  createInvalidDataErrorResponse,
  enforceRateLimit,
  getRequestId,
  handleGameApiError,
} from "@/shared/lib/server";
import {
  parseRequiredGameLocale,
  wheelStartPayloadSchema,
} from "@/features/game-session/api-contracts";
import {
  getOpenWheelRound,
  requireAuthenticatedGameUser,
  startWheelRound,
} from "@/features/game-session/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const locale = parseRequiredGameLocale(searchParams.get("locale"));

    if (!locale) {
      return createInvalidDataErrorResponse(
        "Invalid wheel read payload.",
        requestId
      );
    }

    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.wheel.read",
      limit: 30,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const wheelRound = await getOpenWheelRound({
      playerId: user.id,
      locale,
    });

    return NextResponse.json(wheelRound, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleGameApiError(error, "Failed to read wheel round.", {
      requestId,
      scope: "api.games.wheel.read",
    });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.wheel.start",
      limit: 90,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const body = await request.json().catch(() => null);
    const result = wheelStartPayloadSchema.safeParse(body);

    if (!result.success) {
      return createInvalidDataErrorResponse(
        "Invalid wheel start payload.",
        requestId
      );
    }

    const wheelRound = await startWheelRound({
      playerId: user.id,
      locale: result.data.locale,
    });

    return NextResponse.json(wheelRound);
  } catch (error) {
    return handleGameApiError(error, "Failed to start wheel round.", {
      requestId,
      scope: "api.games.wheel.start",
    });
  }
}
