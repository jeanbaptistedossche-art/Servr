import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const ready = Boolean(key && key !== "your_stripe_publishable_key" && key.startsWith("pk_"));
  return NextResponse.json({ publishableKey: ready ? key : null });
}
