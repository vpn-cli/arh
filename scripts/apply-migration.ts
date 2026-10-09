import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!unpooledUrl) {
    throw new Error("DATABASE_URL_UNPOOLED is not set in environment");
  }

  const parsedUrl = new URL(unpooledUrl);
  console.log(`Connecting to Neon direct host: ${parsedUrl.host} using DATABASE_URL_UNPOOLED`);

  const client = neon(unpooledUrl);
  const db = drizzle(client, { schema });

  // Check if migration 0002 is recorded
  const existing0002 = await db.execute(
    sql`SELECT * FROM "drizzle"."__drizzle_migrations" WHERE "created_at" = 1791457556434`
  );

  if (existing0002.rows.length === 0) {
    console.log("Recording migration 0002_legal_night_thrasher in __drizzle_migrations...");
    await db.execute(
      sql`INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ('276af6f4d8901c254ce5acd30c7c732b26e3c7fe9962d4aa09dd98ff2b385e97', 1791457556434)`
    );
  }

  console.log("Applying pending migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully!");

  // Verify column
  const cols = await db.execute(
    sql`SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'lyrics_cache' AND column_name = 'offset_ms'`
  );
  console.log("Verified offset_ms column on unpooled database:", cols.rows);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
