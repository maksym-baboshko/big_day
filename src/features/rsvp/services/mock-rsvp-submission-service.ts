"use client";

import { rsvpSchema, rsvpStoredSubmissionsSchema } from "../schema/rsvp-schema";
import type { RsvpSubmissionInput, RsvpSubmissionService } from "../types";

const RSVP_STORAGE_KEY = "diandmax:rsvp-submissions";
const MOCK_DELAY_MS = 850;

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

function readStoredSubmissions(): RsvpSubmissionInput[] {
  const stored = window.localStorage.getItem(RSVP_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    const decoded = rsvpStoredSubmissionsSchema.safeParse(parsed);

    return decoded.success ? decoded.data : [];
  } catch {
    return [];
  }
}

export const mockRsvpSubmissionService: RsvpSubmissionService = {
  async submit(input) {
    const requestId = crypto.randomUUID();
    const parsed = rsvpSchema.safeParse(input);

    if (!parsed.success) {
      return { success: false, error: "invalid_input", requestId, mode: "mock" };
    }

    if (parsed.data.website) {
      return { success: true, requestId, mode: "mock" };
    }

    await wait(MOCK_DELAY_MS);

    try {
      const submissions = readStoredSubmissions();
      submissions.push(parsed.data);
      window.localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(submissions));

      return { success: true, requestId, mode: "mock" };
    } catch {
      return { success: false, error: "storage_error", requestId, mode: "mock" };
    }
  },
};
