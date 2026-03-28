import { z } from "zod";

const MAX_GUEST_COUNT = 20;
const MAX_GUEST_NAME_LENGTH = 80;
const MAX_DIETARY_LENGTH = 240;
const MAX_MESSAGE_LENGTH = 500;

const guestNameSchema = z.string().trim().min(2, "name_min").max(MAX_GUEST_NAME_LENGTH, "name_max");

export const rsvpSchema = z.object({
  guestNames: z
    .array(guestNameSchema)
    .min(1, "guest_names_required")
    .max(MAX_GUEST_COUNT, "guest_names_limit"),
  attending: z.enum(["yes", "no"]),
  guests: z.number().int().min(1).max(MAX_GUEST_COUNT),
  dietary: z.string().trim().max(MAX_DIETARY_LENGTH, "dietary_max").optional(),
  message: z.string().trim().max(MAX_MESSAGE_LENGTH, "message_max").optional(),
  website: z.string().optional(), // honeypot
  slug: z.string().optional(),
});

export const rsvpStoredSubmissionsSchema = z.array(rsvpSchema);

export type RsvpFormData = z.infer<typeof rsvpSchema>;
