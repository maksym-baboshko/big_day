"use server";

import { db } from "@/infrastructure/db/client";
import { rsvpResponses } from "@/infrastructure/db/schema";
import { logServerError, logServerInfo, runDeferredTasks } from "@/shared/lib/server";
import { after } from "next/server";
import { rsvpSchema } from "../schema/rsvp-schema";
import type { RsvpFormData } from "../schema/rsvp-schema";

export interface SubmitRsvpResult {
  success: boolean;
  error?: string;
}

export async function submitRsvp(data: RsvpFormData): Promise<SubmitRsvpResult> {
  const requestId = crypto.randomUUID();

  const parsed = rsvpSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "invalid_input" };
  }

  // Honeypot check — silently succeed to confuse bots
  if (parsed.data.website) {
    return { success: true };
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
          label: "rsvp:log",
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

    return { success: true };
  } catch (err) {
    logServerError({
      scope: "rsvp",
      event: "rsvp_insert_failed",
      requestId,
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return { success: false, error: "server_error" };
  }
}
