import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";

import { rsvpSchema } from "@/features/rsvp";
import { db } from "@/infrastructure/db/client";
import { rsvpResponses } from "@/infrastructure/db/schema";
import {
  logServerError,
  logServerInfo,
  makeApiErrorResponse,
  runDeferredTasks,
} from "@/shared/lib/server";

export async function POST(req: NextRequest) {
  const requestId =
    req.headers.get("x-request-id") ?? req.headers.get("x-vercel-id") ?? crypto.randomUUID();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return makeApiErrorResponse(req, {
      error: "Invalid JSON",
      code: "bad_request",
      status: 400,
      requestId,
    });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return makeApiErrorResponse(req, {
      error: "Validation failed",
      code: "validation_error",
      status: 422,
      requestId,
    });
  }

  // Honeypot — silently succeed to confuse bots
  if (parsed.data.website) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const { guestNames, attending, guests, dietary, message, slug } = parsed.data;

  try {
    await db.insert(rsvpResponses).values({
      guestSlug: slug ?? null,
      guestNames,
      attending,
      guestsCount: guests,
      dietary: dietary ?? null,
      message: message ?? null,
    });

    logServerInfo({
      scope: "rsvp",
      event: "rsvp_submitted",
      requestId,
      context: { attending, guests, slug },
    });

    after(() =>
      runDeferredTasks([
        {
          label: "rsvp:log_complete",
          run: async () => {
            logServerInfo({
              scope: "rsvp",
              event: "rsvp_deferred_complete",
              requestId,
              context: { slug },
            });
          },
        },
      ]),
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    logServerError({
      scope: "rsvp",
      event: "rsvp_insert_failed",
      requestId,
      error: err instanceof Error ? err : new Error(String(err)),
    });

    return makeApiErrorResponse(req, {
      error: "Server error",
      code: "server_error",
      status: 500,
      requestId,
    });
  }
}
