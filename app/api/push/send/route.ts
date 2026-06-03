import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export async function POST(req: NextRequest) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? "mailto:info@servr.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? ""
  );
  try {
    const { categorie, titel, beschrijving, opdrachtId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Haal alle vakmensen op van die categorie die push hebben ingeschakeld
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .or(`categorie.eq.${categorie},categorie.is.null`);

    if (!subs?.length) return NextResponse.json({ sent: 0 });

    const payload = JSON.stringify({
      title: `Nieuwe klus: ${titel}`,
      body: beschrijving?.slice(0, 100) ?? "Bekijk de opdracht in de app.",
      url: `/feed`,
      icon: "/api/pwa-icon?size=192",
    });

    let sent = 0;
    const errors: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (e: any) {
          // Verwijder verlopen subscriptions
          if (e.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          errors.push(String(e.message));
        }
      })
    );

    return NextResponse.json({ sent, errors });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
