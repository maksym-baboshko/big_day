import { z } from "zod";

export const rsvpSchema = z.object({
  guestNames: z.array(z.string().min(1)).min(1, "guest_names_required"),
  attending: z.enum(["yes", "no"]),
  guests: z.number().int().min(1).max(20),
  dietary: z.string().optional(),
  message: z.string().optional(),
  website: z.string().optional(), // honeypot
  slug: z.string().optional(),
});

export type RsvpFormData = z.infer<typeof rsvpSchema>;
