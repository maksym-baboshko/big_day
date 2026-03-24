import { z } from "zod";
import { rsvpSchema } from "./schema";

export const rsvpSubmissionPayloadSchema = rsvpSchema;

/**
 * Validates the JSON body returned by POST /api/rsvp.
 * Success:  { success: true, id?: string }
 * Error:    { error: string, code: string, requestId: string }
 * Fallback: null (JSON parse failure)
 */
export const rsvpApiResponseSchema = z
  .object({
    success: z.boolean().optional(),
    error: z.string().optional(),
  })
  .nullable();

export type RsvpApiResponse = z.infer<typeof rsvpApiResponseSchema>;
