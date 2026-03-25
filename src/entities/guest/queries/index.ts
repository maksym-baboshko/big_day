import { db } from "@/infrastructure/db/client";
import type { DbGuest } from "@/infrastructure/db/schema";
import { guests } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetch a guest by their URL slug.
 * Returns null if not found.
 */
export async function fetchGuestBySlug(slug: string): Promise<DbGuest | null> {
  const rows = await db.select().from(guests).where(eq(guests.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/**
 * Fetch all guests ordered by creation date.
 */
export async function fetchGuests(): Promise<DbGuest[]> {
  return db.select().from(guests).orderBy(guests.createdAt);
}
