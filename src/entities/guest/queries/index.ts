import { db } from "@/infrastructure/db/client";
import { guests } from "@/infrastructure/db/schema";
import type { Guest } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

/**
 * Find a guest by their URL slug.
 * Returns null if not found.
 */
export async function findGuestBySlug(slug: string): Promise<Guest | null> {
  const rows = await db.select().from(guests).where(eq(guests.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/**
 * List all guests ordered by creation date.
 */
export async function listGuests(): Promise<Guest[]> {
  return db.select().from(guests).orderBy(guests.createdAt);
}
