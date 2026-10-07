import { NextResponse } from "next/server";
import { db, scrapbookVersions } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
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

    const { id } = await req.json();
    if (typeof id !== "number") {
      return NextResponse.json({ error: "Invalid data format: must provide a numeric id" }, { status: 400 });
    }

    // Database Batch
    // Flips the current active row to false, and the target row to true
    await db.batch([
      db
        .update(scrapbookVersions)
        .set({ isCurrent: false })
        .where(eq(scrapbookVersions.isCurrent, true)),
      db
        .update(scrapbookVersions)
        .set({ isCurrent: true })
        .where(eq(scrapbookVersions.id, id))
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Scrapbook Restore Route] Database write failed. Error: ${errorMessage}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
