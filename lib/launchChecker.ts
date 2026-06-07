/**
 * Launch Readiness Checker — Servr
 *
 * Server-side only (gebruikt process.env en fs).
 * Roep aan via /api/launch/check
 */

export type CheckStatus = "pass" | "fail" | "warning";

export type CheckResult = {
  id: string;
  naam: string;
  status: CheckStatus;
  detail: string;
  fixInstructions?: string;
};

export type LaunchReport = {
  checks: CheckResult[];
  score: number;
  totaal: number;
  klaarVoorLaunch: boolean;
  gegenereerd: string;
};

// ─── Individuele checks ───────────────────────────────────────────────────────

function envCheck(
  id: string,
  naam: string,
  envVar: string,
  placeholder?: string,
  fixTip?: string
): CheckResult {
  const val = process.env[envVar];
  if (!val || val === placeholder || val === `your_${envVar.toLowerCase()}`) {
    return {
      id, naam,
      status: "fail",
      detail: `${envVar} is niet ingesteld of staat op placeholder.`,
      fixInstructions: fixTip ?? `Voeg ${envVar} toe in Vercel → Settings → Environment Variables.`,
    };
  }
  return { id, naam, status: "pass", detail: `${envVar} aanwezig (${val.slice(0, 8)}…)` };
}

async function supabaseConnectieCheck(): Promise<CheckResult> {
  const id = "supabase_connectie";
  const naam = "Supabase connectie";
  try {
    const { supabase, supabaseReady } = await import("./supabase");
    if (!supabaseReady) {
      return { id, naam, status: "fail", detail: "Supabase URL of anon key ontbreekt.", fixInstructions: "Zet NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel." };
    }
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw new Error(error.message);
    return { id, naam, status: "pass", detail: "Query op profiles tabel geslaagd." };
  } catch (err) {
    return { id, naam, status: "fail", detail: `Fout: ${err instanceof Error ? err.message : String(err)}`, fixInstructions: "Controleer Supabase URL, anon key en RLS policies." };
  }
}

async function vakmanBeschikbaarCheck(): Promise<CheckResult> {
  const id = "vakman_beschikbaar";
  const naam = "Minstens 1 beschikbare vakman";
  try {
    const { supabase, supabaseReady } = await import("./supabase");
    if (!supabaseReady) return { id, naam, status: "warning", detail: "Supabase niet beschikbaar.", fixInstructions: "Fix Supabase connectie eerst." };
    const { data, error } = await (supabase.from("vakmensen") as any)
      .select("id")
      .eq("beschikbaar", true)
      .limit(1);
    if (error) throw new Error(error.message);
    if (!data?.length) {
      return { id, naam, status: "fail", detail: "Geen vakmensen met beschikbaar=true gevonden.", fixInstructions: "Maak een testaccount aan via /vakman-setup en zet beschikbaar=true." };
    }
    return { id, naam, status: "pass", detail: `${data.length}+ beschikbare vakmensen gevonden.` };
  } catch (err) {
    return { id, naam, status: "fail", detail: `Fout: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function stripeIntentCheck(): Promise<CheckResult> {
  const id = "stripe_intent";
  const naam = "Stripe PaymentIntent route";
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return { id, naam, status: "fail", detail: "STRIPE_SECRET_KEY ontbreekt of is geen geldige sk_… key.", fixInstructions: "Voeg STRIPE_SECRET_KEY toe in Vercel → Environment Variables." };
  }
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
    // Minimale test: haal account info op
    await stripe.balance.retrieve();
    return { id, naam, status: "pass", detail: "Stripe API key geldig en bereikbaar." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { id, naam, status: "fail", detail: `Stripe API fout: ${msg}`, fixInstructions: "Controleer of STRIPE_SECRET_KEY klopt in Vercel." };
  }
}

function mockDataImportCheck(pagina: string, bestandPad: string): CheckResult {
  const id = `mockdata_${pagina.replace(/\//g, "_")}`;
  const naam = `Geen mockData in ${pagina}`;
  try {
    const fs = require("fs");
    const path = require("path");
    const volledigPad = path.join(process.cwd(), bestandPad);
    if (!fs.existsSync(volledigPad)) {
      return { id, naam, status: "warning", detail: `Bestand ${bestandPad} niet gevonden.` };
    }
    const inhoud = fs.readFileSync(volledigPad, "utf-8");
    const gebruiktMock = inhoud.includes("mockData") && !inhoud.includes("// DEPRECATED");
    if (gebruiktMock) {
      return { id, naam, status: "fail", detail: `${pagina} importeert nog mock data.`, fixInstructions: `Vervang mockData imports in ${bestandPad} met Supabase queries.` };
    }
    return { id, naam, status: "pass", detail: `${pagina} gebruikt geen mock data.` };
  } catch {
    return { id, naam, status: "warning", detail: "Kon bestand niet lezen." };
  }
}

function paginaBestaatCheck(id: string, naam: string, pad: string): CheckResult {
  try {
    const fs = require("fs");
    const path = require("path");
    const volledigPad = path.join(process.cwd(), "app", pad, "page.tsx");
    const bestaat = fs.existsSync(volledigPad);
    return {
      id, naam,
      status: bestaat ? "pass" : "fail",
      detail: bestaat ? `${pad}/page.tsx bestaat.` : `${pad}/page.tsx ontbreekt.`,
      fixInstructions: bestaat ? undefined : `Maak app${pad}/page.tsx aan.`,
    };
  } catch {
    return { id, naam, status: "warning", detail: "Kon pagina niet controleren." };
  }
}

// ─── Hoofd functie ────────────────────────────────────────────────────────────

export async function checkLaunchReadiness(): Promise<LaunchReport> {
  const checks: CheckResult[] = await Promise.all([
    // Supabase
    supabaseConnectieCheck(),
    vakmanBeschikbaarCheck(),

    // Stripe
    envCheck("stripe_secret", "Stripe Secret Key", "STRIPE_SECRET_KEY", "your_stripe_secret_key", "Haal op via stripe.com/dashboard → Developers → API keys"),
    envCheck("stripe_publishable", "Stripe Publishable Key", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "your_stripe_publishable_key"),
    envCheck("stripe_webhook", "Stripe Webhook Secret", "STRIPE_WEBHOOK_SECRET", undefined, "Maak webhook aan op stripe.com/dashboard → Developers → Webhooks. URL: https://jouw-app.vercel.app/api/stripe/webhook"),
    stripeIntentCheck(),

    // Push
    envCheck("vapid_public", "VAPID Public Key", "NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    envCheck("vapid_private", "VAPID Private Key", "VAPID_PRIVATE_KEY"),

    // Supabase keys
    envCheck("supabase_url", "Supabase URL", "NEXT_PUBLIC_SUPABASE_URL", "your_supabase_url"),
    envCheck("supabase_anon", "Supabase Anon Key", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "your_supabase_anon_key"),
    envCheck("supabase_service", "Supabase Service Role Key", "SUPABASE_SERVICE_ROLE_KEY", "your_service_role_key", "Haal op via supabase.com → project → Settings → API → service_role"),

    // Pagina's
    paginaBestaatCheck("privacy_page", "Privacy policy pagina", "/privacybeleid"),
    paginaBestaatCheck("terms_page", "Algemene voorwaarden pagina", "/voorwaarden"),

    // Mock data checks
    mockDataImportCheck("provider/[id]", "app/provider/[id]/page.tsx"),
    mockDataImportCheck("agenda/boeken/[id]", "app/agenda/boeken/[vakmanId]/page.tsx"),
  ]);

  const pasCount = checks.filter(c => c.status === "pass").length;
  const totaal = checks.length;
  const klaarVoorLaunch = checks.every(c => c.status !== "fail");

  return {
    checks,
    score: pasCount,
    totaal,
    klaarVoorLaunch,
    gegenereerd: new Date().toISOString(),
  };
}
