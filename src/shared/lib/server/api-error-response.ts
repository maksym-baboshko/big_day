import { NextResponse } from "next/server";
import { getRequestId } from "./request-id";

interface ApiErrorOptions {
  error: string;
  code: string;
  status: number;
  retryAfterSeconds?: number;
  requestId?: string;
}

export function makeApiErrorResponse(request: Request, options: ApiErrorOptions): NextResponse {
  const requestId = options.requestId ?? getRequestId(request);

  const body: Record<string, unknown> = {
    error: options.error,
    code: options.code,
    requestId,
  };

  if (options.retryAfterSeconds !== undefined) {
    body.retryAfterSeconds = options.retryAfterSeconds;
  }

  const headers: Record<string, string> = {
    "x-request-id": requestId,
  };

  if (options.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(options.retryAfterSeconds);
  }

  return NextResponse.json(body, { status: options.status, headers });
}
