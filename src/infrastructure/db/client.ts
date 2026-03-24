import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Singleton Drizzle client connected to Supabase Postgres.
 * Never import this in client components.
 */

// Prevent multiple connections in development (Next.js hot reload)
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  pgClient: ReturnType<typeof postgres> | undefined;
};

function createDb() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(url, {
    // Supabase requires SSL in production
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
    max: 1, // Limit connections in serverless environment
  });

  return { db: drizzle(client, { schema }), client };
}

if (!globalForDb.db) {
  const { db, client } = createDb();
  globalForDb.db = db;
  globalForDb.pgClient = client;
}

export const db = globalForDb.db!;
