import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupportedLocale } from "@/shared/config";
import { enforceRateLimit, handleGameApiError } from "@/shared/lib/server";
import {
  getOpenWheelRound,
  requireAuthenticatedGameUser,
  startWheelRound,
} from "@/features/game-session/server";

export const runtime = "nodejs";

const wheelStartSchema = z.object({
  locale: z.enum(["uk", "en"]),
});

function getLocaleFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = z.enum(["uk", "en"]).safeParse(searchParams.get("locale"));

  return result.success ? (result.data as SupportedLocale) : null;
}

export async function GET(request: Request) {
  try {
    const locale = getLocaleFromRequest(request);

    if (!locale) {
      return NextResponse.json(
        { error: "Invalid wheel read payload.", code: "INVALID_DATA" },
        { status: 400 }
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
    return handleGameApiError(error, "Failed to read wheel round.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.wheel.start",
      limit: 90,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const body = await request.json();
    const result = wheelStartSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid wheel start payload.", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    const wheelRound = await startWheelRound({
      playerId: user.id,
      locale: result.data.locale as SupportedLocale,
    });

    return NextResponse.json(wheelRound);
  } catch (error) {
    return handleGameApiError(error, "Failed to start wheel round.");
  }
}
