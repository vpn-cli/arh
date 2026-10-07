import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import fallbackData from "@/data/scrapbook-data.json";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "scrapbook-data.json");
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      return NextResponse.json(JSON.parse(fileContents), {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Failed to read scrapbook data from disk, using bundle fallback:", error);
    return NextResponse.json(fallbackData);
  }
}
