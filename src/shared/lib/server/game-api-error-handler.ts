import "server-only";

import { NextResponse } from "next/server";
import {
  InvalidWheelRoundResponseError,
  InvalidWheelRoundStateError,
  PlayerProfileNotReadyError,
  SupabaseConfigurationError,
  UnauthorizedGameRequestError,
  WheelRoundAlreadyResolvedError,
  WheelRoundNotFoundError,
  WheelTasksDepletedError,
} from "@/features/game-session/server";
import { getRateLimitErrorPayload, RateLimitExceededError } from "./rate-limit";

const ERROR_MAP: ReadonlyArray<{
  errorClass: new (...args: never[]) => Error;
  status: number;
  code: string;
  message: string;
}> = [
  {
    errorClass: SupabaseConfigurationError,
    status: 503,
    code: "SUPABASE_NOT_CONFIGURED",
    message: "Supabase is not configured.",
  },
  {
    errorClass: UnauthorizedGameRequestError,
    status: 401,
    code: "UNAUTHORIZED",
    message: "Unauthorized game request.",
  },
  {
    errorClass: PlayerProfileNotReadyError,
    status: 409,
    code: "PLAYER_NOT_FOUND",
    message: "Player profile is not ready yet.",
  },
  {
    errorClass: WheelTasksDepletedError,
    status: 409,
    code: "NO_TASKS_LEFT",
    message: "No wheel tasks remain for this player.",
  },
  {
    errorClass: WheelRoundNotFoundError,
    status: 404,
    code: "ROUND_NOT_FOUND",
    message: "Wheel round was not found.",
  },
  {
    errorClass: WheelRoundAlreadyResolvedError,
    status: 409,
    code: "ROUND_ALREADY_RESOLVED",
    message: "Wheel round is already resolved.",
  },
  {
    errorClass: InvalidWheelRoundResponseError,
    status: 400,
    code: "INVALID_DATA",
    message: "Wheel round response is invalid.",
  },
  {
    errorClass: InvalidWheelRoundStateError,
    status: 409,
    code: "INVALID_DATA",
    message: "Wheel round state is invalid.",
  },
];

export function handleGameApiError(
  error: unknown,
  fallbackMessage: string
): NextResponse {
  if (error instanceof RateLimitExceededError) {
    return NextResponse.json(
      getRateLimitErrorPayload(error.retryAfterSeconds),
      {
        status: 429,
        headers: {
          "Retry-After": String(error.retryAfterSeconds),
        },
      }
    );
  }

  for (const entry of ERROR_MAP) {
    if (error instanceof entry.errorClass) {
      return NextResponse.json(
        { error: entry.message, code: entry.code },
        { status: entry.status }
      );
    }
  }

  console.error(fallbackMessage, error);
  return NextResponse.json(
    { error: fallbackMessage, code: "PERSISTENCE_ERROR" },
    { status: 500 }
  );
}
