import { after, NextResponse } from "next/server";
import {
  createInvalidDataErrorResponse,
  enforceRateLimit,
  getRequestId,
  handleGameApiError,
  runDeferredTasks,
} from "@/shared/lib/server";
import {
  parseDefaultedGameLocale,
  playerPayloadSchema,
} from "@/features/game-session/api-contracts";
import {
  bootstrapPlayerProfile,
  savePlayerProfile,
  requireAuthenticatedGameUser,
} from "@/features/game-session/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.player.read",
      limit: 60,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const { searchParams } = new URL(request.url);
    const locale = parseDefaultedGameLocale(searchParams.get("locale"));
    const player = await bootstrapPlayerProfile({
      authUserId: user.id,
      locale,
    });

    return NextResponse.json({ player });
  } catch (error) {
    return handleGameApiError(error, "Failed to read player session.", {
      requestId,
      scope: "api.games.player.read",
    });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.player.save",
      limit: 20,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const body = await request.json().catch(() => null);
    const result = playerPayloadSchema.safeParse(body);

    if (!result.success) {
      return createInvalidDataErrorResponse(
        "Invalid player payload.",
        requestId
      );
    }

    const { player, deferredTasks } = await savePlayerProfile({
      authUserId: user.id,
      nickname: result.data.nickname,
      locale: result.data.locale,
    });
    after(() => runDeferredTasks(deferredTasks ?? []));
    return NextResponse.json({ player });
  } catch (error) {
    return handleGameApiError(error, "Failed to save player session.", {
      requestId,
      scope: "api.games.player.save",
    });
  }
}
