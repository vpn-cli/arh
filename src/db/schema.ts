import { pgTable, serial, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const scrapbookVersions = pgTable("scrapbook_versions", {
  id: serial("id").primaryKey(),
  name: text("name").default("main"),
  data: jsonb("data").notNull(),
  isCurrent: boolean("is_current").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ScrapbookVersion = typeof scrapbookVersions.$inferSelect;
export type NewScrapbookVersion = typeof scrapbookVersions.$inferInsert;
