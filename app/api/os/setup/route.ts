import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ANTHROPIC_API_KEY",
];

async function setVercelEnvVar(
  key: string,
  value: string,
  token: string,
  projectId: string,
  teamId?: string
) {
  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/env`;

  // Check if env var already exists and delete first
  try {
    const listRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env${teamId ? `?teamId=${teamId}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (listRes.ok) {
      const { envs } = await listRes.json();
      const existing = envs?.find((e: { key: string; id: string }) => e.key === key);
      if (existing) {
        await fetch(
          `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}${teamId ? `?teamId=${teamId}` : ""}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        );
      }
    }
  } catch {}

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production", "preview", "development"],
    }),
  });
  return res.ok;
}

async function triggerVercelDeploy(token: string, projectId: string, teamId?: string) {
  const url = teamId
    ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
    : `https://api.vercel.com/v13/deployments`;

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: projectId, target: "production" }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Valideer verplichte velden
    const missing = REQUIRED_KEYS.filter((k) => !body[k]?.trim());
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Ontbrekende verplichte velden: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const results: Record<string, boolean> = {};

    // Schrijf naar .env.local voor lokale ontwikkeling
    const envPath = path.join(process.cwd(), ".env.local");
    const envLines: string[] = [];

    const envMap: Record<string, string> = {
      NEXT_PUBLIC_SUPABASE_URL: body.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: body.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: body.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_PUBLISHABLE_KEY: body.STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: body.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: body.STRIPE_WEBHOOK_SECRET,
      ANTHROPIC_API_KEY: body.ANTHROPIC_API_KEY,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: body.VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: body.VAPID_PRIVATE_KEY,
      VERCEL_TOKEN: body.VERCEL_TOKEN,
      VERCEL_PROJECT_ID: body.VERCEL_PROJECT_ID,
      VERCEL_TEAM_ID: body.VERCEL_TEAM_ID,
      GITHUB_TOKEN: body.GITHUB_TOKEN,
      GITHUB_USERNAME: body.GITHUB_USERNAME,
      TWILIO_ACCOUNT_SID: body.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: body.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: body.TWILIO_PHONE_NUMBER,
      SETUP_COMPLETE: "true",
    };

    for (const [key, value] of Object.entries(envMap)) {
      if (value?.trim()) {
        envLines.push(`${key}=${value.trim()}`);
        results[key] = true;
      }
    }

    // Lees bestaand .env.local en merge
    let existingEnv = "";
    try { existingEnv = fs.readFileSync(envPath, "utf-8"); } catch {}
    const existingLines = existingEnv.split("\n").filter(l => {
      const key = l.split("=")[0];
      return key && !envMap[key];
    });
    const finalEnv = [...existingLines, ...envLines].join("\n") + "\n";
    fs.writeFileSync(envPath, finalEnv);

    // Vercel API — zet env vars in productie
    const vercelToken = body.VERCEL_TOKEN?.trim();
    const projectId = body.VERCEL_PROJECT_ID?.trim();
    const teamId = body.VERCEL_TEAM_ID?.trim();

    if (vercelToken && projectId) {
      for (const [key, value] of Object.entries(envMap)) {
        if (value?.trim() && key !== "SETUP_COMPLETE") {
          const ok = await setVercelEnvVar(key, value.trim(), vercelToken, projectId, teamId || undefined);
          results[`vercel_${key}`] = ok;
        }
      }
      // SETUP_COMPLETE in Vercel
      await setVercelEnvVar("SETUP_COMPLETE", "true", vercelToken, projectId, teamId || undefined);

      // Trigger redeploy
      await triggerVercelDeploy(vercelToken, projectId, teamId || undefined);
      results["vercel_deploy_triggered"] = true;
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
