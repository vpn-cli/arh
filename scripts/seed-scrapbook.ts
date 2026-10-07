import { db, scrapbookVersions } from "../src/db";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

// Ensure env is loaded
config({ path: ".env.local" });

async function main() {
  console.log("Checking for existing current scrapbook...");
  const existing = await db
    .select()
    .from(scrapbookVersions)
    .where(eq(scrapbookVersions.isCurrent, true))
    .limit(1);

  if (existing.length > 0) {
    console.log("Abort: A current scrapbook row already exists. Idempotent seed complete.");
    process.exit(0);
  }

  console.log("No current row found. Seeding from local JSON...");
  const filePath = path.join(process.cwd(), "src/data/scrapbook-data.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const inserted = await db
    .insert(scrapbookVersions)
    .values({
      name: "initial-seed",
      data: data,
      isCurrent: true,
    })
    .returning();

  console.log(`Successfully seeded scrapbook! Rows inserted: ${inserted.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
