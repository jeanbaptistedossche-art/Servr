import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), "BACKLOG.md"), "utf-8");
    return new NextResponse(content, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    return new NextResponse("", { status: 200 });
  }
}
