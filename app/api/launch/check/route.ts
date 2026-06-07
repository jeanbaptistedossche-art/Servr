import { NextResponse } from "next/server";
import { checkLaunchReadiness } from "@/lib/launchChecker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await checkLaunchReadiness();
    return NextResponse.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
