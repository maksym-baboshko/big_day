import { after, NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceRateLimit,
  handleGameApiError,
  runDeferredTasks,
} from "@/shared/lib/server";
import {
  bootstrapPlayerProfile,
  savePlayerProfile,
  requireAuthenticatedGameUser,
} from "@/features/game-session/server";

export const runtime = "nodejs";

const playerPayloadSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((value) => value.replace(/\s+/g, " ")),
  locale: z.enum(["uk", "en"]).default("uk"),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    const { searchParams } = new URL(request.url);
    const locale = z.enum(["uk", "en"]).catch("uk").parse(searchParams.get("locale"));
    const player = await bootstrapPlayerProfile({
      authUserId: user.id,
      locale,
    });

    return NextResponse.json({ player });
  } catch (error) {
    return handleGameApiError(error, "Failed to read player session.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedGameUser(request);
    await enforceRateLimit({
      request,
      scope: "games.player.save",
      limit: 20,
      windowSeconds: 10 * 60,
      authUserId: user.id,
    });

    const body = await request.json();
    const result = playerPayloadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid player payload.", code: "INVALID_DATA" },
        { status: 400 }
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
    return handleGameApiError(error, "Failed to save player session.");
  }
}
