import { z } from "zod";

const optionalTextField = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .or(z.literal(""));

const guestNameField = z.string().trim().min(2).max(120);

export const rsvpSchema = z
  .object({
    guestNames: z.array(guestNameField).min(1).max(10),
    attending: z.enum(["yes", "no"]),
    guests: z.coerce.number().int().min(1).max(10).optional(),
    dietary: optionalTextField(500),
    message: optionalTextField(1000),
    website: z.string().trim().max(500).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.attending === "yes" && !data.guests) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guests"],
        message: "Guests count is required when attending.",
      });
    }

    if (
      data.attending === "yes" &&
      data.guests &&
      data.guestNames.length !== data.guests
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guestNames"],
        message: "Guest names count must match the selected guest count.",
      });
    }

    if (data.attending === "no" && data.guestNames.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guestNames"],
        message: "Only one name is expected when declining.",
      });
    }
  });

export type RSVPFormData = z.infer<typeof rsvpSchema>;
