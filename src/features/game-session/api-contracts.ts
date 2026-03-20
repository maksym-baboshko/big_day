import { z } from "zod";
import { GAME_SLUG_ENUM } from "@/shared/config";

export const supportedGameLocaleSchema = z.enum(["uk", "en"]);

export const playerPayloadSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((value) => value.replace(/\s+/g, " ")),
  locale: supportedGameLocaleSchema.default("uk"),
});

export const wheelStartPayloadSchema = z.object({
  locale: supportedGameLocaleSchema,
});

export const wheelResolutionPayloadSchema = z.object({
  locale: supportedGameLocaleSchema,
  resolution: z.enum(["completed", "promised", "skipped"]),
  responseText: z.string().trim().max(300).optional().nullable(),
});

export const wheelTimerPayloadSchema = z.object({
  locale: supportedGameLocaleSchema,
});

export const liveSnapshotQuerySchema = z.object({
  leaderboardLimit: z.coerce.number().int().min(1).max(50).optional(),
  feedLimit: z.coerce.number().int().min(1).max(50).optional(),
});

export const leaderboardQuerySchema = z.object({
  game: z.enum(GAME_SLUG_ENUM),
  topLimit: z.coerce.number().int().min(1).max(10).optional(),
  radius: z.coerce.number().int().min(1).max(3).optional(),
});

export function parseDefaultedGameLocale(value: unknown): "uk" | "en" {
  return supportedGameLocaleSchema.catch("uk").parse(value);
}

export function parseRequiredGameLocale(value: unknown): "uk" | "en" | null {
  const result = supportedGameLocaleSchema.safeParse(value);

  return result.success ? result.data : null;
}

export function parseRoundId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}
