import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireFounderApi } from "@/lib/os/requireFounderApi";

export async function GET() {
  const deny = await requireFounderApi();
  if (deny) return deny;

  try {
    const content = fs.readFileSync(path.join(process.cwd(), "BACKLOG.md"), "utf-8");
    return new NextResponse(content, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    return new NextResponse("", { status: 200 });
  }
}
