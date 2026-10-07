import { NextResponse } from "next/server";
import { db, scrapbookVersions } from "@/db";
import { desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const adminSecret = process.env.SCRAPBOOK_ADMIN_SECRET;
    
    // Server misconfiguration
    if (!adminSecret) {
      return NextResponse.json({ error: "Server misconfiguration: SCRAPBOOK_ADMIN_SECRET is unset" }, { status: 500 });
    }

    // Client authorization
    const secret = req.headers.get("x-scrapbook-secret");
    if (secret !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db
      .select({
        id: scrapbookVersions.id,
        name: scrapbookVersions.name,
        created_at: scrapbookVersions.createdAt,
      })
      .from(scrapbookVersions)
      .orderBy(desc(scrapbookVersions.createdAt))
      .limit(20);

    return NextResponse.json({ versions: results }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Scrapbook Versions Get Route] Database read failed. Error: ${errorMessage}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
