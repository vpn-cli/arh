import { pgTable, serial, text, jsonb, boolean, timestamp, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const scrapbookVersions = pgTable("scrapbook_versions", {
  id: serial("id").primaryKey(),
  name: text("name").default("main"),
  data: jsonb("data").notNull(),
  isCurrent: boolean("is_current").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    isCurrentUnique: uniqueIndex("is_current_unique").on(table.isCurrent).where(sql`"is_current" = true`),
  };
});

export type ScrapbookVersion = typeof scrapbookVersions.$inferSelect;
export type NewScrapbookVersion = typeof scrapbookVersions.$inferInsert;

export const lyricsCache = pgTable("lyrics_cache", {
  spotifyId: text("spotify_id").primaryKey(),
  source: text("source").notNull(),
  synced: text("synced"),
  plain: text("plain"),
  instrumental: boolean("instrumental").default(false).notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  offsetMs: integer("offset_ms").default(0).notNull(),
});

export type LyricsCacheEntry = typeof lyricsCache.$inferSelect;
export type NewLyricsCacheEntry = typeof lyricsCache.$inferInsert;

