import { NextResponse } from "next/server";
import fs from "fs";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const data = await req.json();
    fs.appendFileSync("browser-logs.txt", JSON.stringify(data) + "\n");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
