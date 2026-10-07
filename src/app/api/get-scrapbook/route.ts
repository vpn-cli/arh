import { NextResponse } from "next/server";
import { db, scrapbookVersions } from "@/db";
import { eq, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";
import fallbackData from "@/data/scrapbook-data.json";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db
      .select()
      .from(scrapbookVersions)
      .where(eq(scrapbookVersions.isCurrent, true))
      .orderBy(desc(scrapbookVersions.createdAt))
      .limit(1);

    if (result.length > 0 && result[0].data) {
      return NextResponse.json({ source: "db", data: result[0].data }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // No fallback logging locally
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Scrapbook Get Route] Database read failed. Error: ${errorMessage}`);
  }

  // Fallback: Try reading from disk first (useful for local dev), then fall back to bundled import
  try {
    const filePath = path.join(process.cwd(), "src", "data", "scrapbook-data.json");
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      return NextResponse.json({ source: "fallback", data: JSON.parse(fileContents) }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
  } catch (e) {
    // Ignore fs error and drop through to bundled fallback
  }

  return NextResponse.json({ source: "fallback", data: fallbackData }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
