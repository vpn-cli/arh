import { pgTable, serial, text, jsonb, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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
