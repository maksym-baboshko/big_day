import "server-only";

import { NextResponse } from "next/server";

export interface ApiErrorResponse {
  error: string;
  code: string;
  requestId: string;
  retryAfterSeconds?: number;
}

interface CreateApiErrorResponseOptions extends ApiErrorResponse {
  status: number;
}

export function createApiErrorPayload({
  error,
  code,
  requestId,
  retryAfterSeconds,
}: ApiErrorResponse): ApiErrorResponse {
  return {
    error,
    code,
    requestId,
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };
}

export function createApiErrorResponse({
  status,
  error,
  code,
  requestId,
  retryAfterSeconds,
}: CreateApiErrorResponseOptions): NextResponse {
  const headers = new Headers();

  if (retryAfterSeconds !== undefined) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }

  return NextResponse.json(
    createApiErrorPayload({
      error,
      code,
      requestId,
      retryAfterSeconds,
    }),
    {
      status,
      headers,
    }
  );
}

export function createInvalidDataErrorResponse(
  error: string,
  requestId: string
): NextResponse {
  return createApiErrorResponse({
    status: 400,
    error,
    code: "INVALID_DATA",
    requestId,
  });
}
