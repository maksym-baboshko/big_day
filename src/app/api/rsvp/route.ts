import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  getRateLimitErrorPayload,
  RateLimitExceededError,
} from "@/shared/lib/server";
import { rsvpSchema } from "@/widgets/rsvp/model";
import { getRsvpEmailConfig, sendRsvpNotification } from "@/widgets/rsvp/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await enforceRateLimit({
      request,
      scope: "rsvp.submit",
      limit: 6,
      windowSeconds: 15 * 60,
    });

    const body = await request.json();
    const result = rsvpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    if (result.data.website) {
      return NextResponse.json({ success: true });
    }

    const emailConfig = getRsvpEmailConfig();

    if (!emailConfig) {
      console.error("RSVP API is missing required Resend configuration.");
      return NextResponse.json(
        { error: "RSVP is not configured", code: "RSVP_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const emailId = await sendRsvpNotification(result.data, emailConfig);

    return NextResponse.json({ success: true, id: emailId });
  } catch (error) {
    console.error("RSVP API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

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

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
