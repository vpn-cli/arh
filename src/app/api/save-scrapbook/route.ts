import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // We save to src/data/scrapbook-data.json
    const filePath = path.join(process.cwd(), "src", "data", "scrapbook-data.json");
    
    // Ensure the data directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Keep a copy of the previous layout as requested!
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(dir, "scrapbook-data-previous.json");
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save scrapbook data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
