import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const STATE_PATH = path.join(process.cwd(), "STATE.md");

export async function GET() {
  try {
    const content = fs.readFileSync(STATE_PATH, "utf-8");
    return new NextResponse(content, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    return new NextResponse("", { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    fs.writeFileSync(STATE_PATH, content, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
