import "server-only";

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
import { createApiErrorResponse } from "./api-error-response";
import { logServerError } from "./logger";
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

interface HandleGameApiErrorOptions {
  requestId: string;
  scope: string;
}

export function handleGameApiError(
  error: unknown,
  fallbackMessage: string,
  options: HandleGameApiErrorOptions
) {
  if (error instanceof RateLimitExceededError) {
    return createApiErrorResponse({
      status: 429,
      ...getRateLimitErrorPayload(error.retryAfterSeconds, options.requestId),
    });
  }

  for (const entry of ERROR_MAP) {
    if (error instanceof entry.errorClass) {
      return createApiErrorResponse({
        status: entry.status,
        error: entry.message,
        code: entry.code,
        requestId: options.requestId,
      });
    }
  }

  logServerError({
    scope: options.scope,
    event: "unhandled_api_error",
    requestId: options.requestId,
    context: {
      fallbackMessage,
    },
    error,
  });

  return createApiErrorResponse({
    status: 500,
    error: fallbackMessage,
    code: "PERSISTENCE_ERROR",
    requestId: options.requestId,
  });
}
