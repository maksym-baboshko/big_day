import { NextResponse } from "next/server";
import { liveSnapshotQuerySchema } from "@/features/game-session/api-contracts";
import {
  getLivePageSnapshot,
  SupabaseConfigurationError,
} from "@/features/game-session/server";
import {
  createApiErrorResponse,
  createInvalidDataErrorResponse,
  getRequestId,
  logServerError,
} from "@/shared/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const result = liveSnapshotQuerySchema.safeParse({
      leaderboardLimit: searchParams.get("leaderboardLimit") ?? undefined,
      feedLimit: searchParams.get("feedLimit") ?? undefined,
    });

    if (!result.success) {
      return createInvalidDataErrorResponse(
        "Invalid live snapshot query.",
        requestId
      );
    }

    const snapshot = await getLivePageSnapshot({
      leaderboardLimit: result.data.leaderboardLimit ?? 10,
      feedLimit: result.data.feedLimit ?? 5,
    });

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return createApiErrorResponse({
        status: 503,
        error: "Supabase is not configured.",
        code: "SUPABASE_NOT_CONFIGURED",
        requestId,
      });
    }

    logServerError({
      scope: "api.live.read",
      event: "unhandled_route_error",
      requestId,
      error,
    });

    return createApiErrorResponse({
      status: 500,
      error: "Failed to read live snapshot.",
      code: "PERSISTENCE_ERROR",
      requestId,
    });
  }
}
