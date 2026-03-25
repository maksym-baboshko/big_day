import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// ─── Phase 1: Invitation & RSVP ────────────────────────────────────

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameUk: text("name_uk").notNull(),
  nameEn: text("name_en").notNull(),
  vocativeUk: text("vocative_uk").notNull(),
  vocativeEn: text("vocative_en").notNull(),
  formName: text("form_name"),
  seats: integer("seats").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rsvpResponses = pgTable("rsvp_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestSlug: text("guest_slug").references(() => guests.slug),
  guestNames: text("guest_names").array().notNull(),
  attending: text("attending", { enum: ["yes", "no"] }).notNull(),
  guestsCount: integer("guests_count").notNull().default(1),
  dietary: text("dietary"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Phase 2: Game Hub (future) ─────────────────────────────────────

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  nickname: text("nickname").notNull(),
  supabaseAnonUid: text("supabase_anon_uid").unique(),
  guestSlug: text("guest_slug").references(() => guests.slug),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gameEvents = pgTable("game_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  playerId: uuid("player_id").references(() => players.id),
  payload: jsonb("payload").notNull().default({}),
  xpDelta: integer("xp_delta").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leaderboard = pgTable("leaderboard", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .notNull()
    .unique()
    .references(() => players.id),
  nickname: text("nickname").notNull(),
  totalXp: integer("total_xp").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── DB row types (Drizzle-inferred) ───────────────────────────────
// Prefixed with "Db" to distinguish from domain models in entities/

export type DbGuest = typeof guests.$inferSelect;
export type DbNewGuest = typeof guests.$inferInsert;
export type DbRsvpResponse = typeof rsvpResponses.$inferSelect;
export type DbNewRsvpResponse = typeof rsvpResponses.$inferInsert;
export type DbPlayer = typeof players.$inferSelect;
export type DbGameEvent = typeof gameEvents.$inferSelect;
export type DbLeaderboardEntry = typeof leaderboard.$inferSelect;
