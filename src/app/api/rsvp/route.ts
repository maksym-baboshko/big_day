import { NextResponse } from "next/server";
import {
  createApiErrorResponse,
  createInvalidDataErrorResponse,
  enforceRateLimit,
  getRateLimitErrorPayload,
  getRequestId,
  logServerError,
  RateLimitExceededError,
} from "@/shared/lib/server";
import { rsvpSubmissionPayloadSchema } from "@/widgets/rsvp/model/api-contracts";
import { getRsvpEmailConfig, sendRsvpNotification } from "@/widgets/rsvp/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await enforceRateLimit({
      request,
      scope: "rsvp.submit",
      limit: 6,
      windowSeconds: 15 * 60,
    });

    const body = await request.json().catch(() => null);
    const result = rsvpSubmissionPayloadSchema.safeParse(body);

    if (!result.success) {
      return createInvalidDataErrorResponse(
        "Invalid RSVP payload.",
        requestId
      );
    }

    if (result.data.website) {
      return NextResponse.json({ success: true });
    }

    const emailConfig = getRsvpEmailConfig();

    if (!emailConfig) {
      logServerError({
        scope: "api.rsvp.submit",
        event: "missing_email_config",
        requestId,
      });

      return createApiErrorResponse({
        status: 503,
        error: "RSVP is not configured",
        code: "RSVP_NOT_CONFIGURED",
        requestId,
      });
    }

    const emailId = await sendRsvpNotification(result.data, emailConfig);

    return NextResponse.json({ success: true, id: emailId });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

    if (error instanceof RateLimitExceededError) {
      return createApiErrorResponse({
        status: 429,
        ...getRateLimitErrorPayload(error.retryAfterSeconds, requestId),
      });
    }

    logServerError({
      scope: "api.rsvp.submit",
      event: "unhandled_route_error",
      requestId,
      error,
    });

    return createApiErrorResponse({
      status: 500,
      error:
        process.env.NODE_ENV === "development"
          ? errorMessage
          : "Internal Server Error",
      code: "PERSISTENCE_ERROR",
      requestId,
    });
  }
}
