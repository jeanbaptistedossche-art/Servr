"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type FieldKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "STRIPE_PUBLISHABLE_KEY"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "ANTHROPIC_API_KEY"
  | "VAPID_PUBLIC_KEY"
  | "VAPID_PRIVATE_KEY"
  | "VERCEL_TOKEN"
  | "VERCEL_PROJECT_ID"
  | "VERCEL_TEAM_ID"
  | "GITHUB_TOKEN"
  | "GITHUB_USERNAME"
  | "TWILIO_ACCOUNT_SID"
  | "TWILIO_AUTH_TOKEN"
  | "TWILIO_PHONE_NUMBER";

type Values = Record<FieldKey, string>;
type Shown = Record<FieldKey, boolean>;

const SECTIONS = [
  {
    title: "SUPABASE",
    fields: [
      { key: "NEXT_PUBLIC_SUPABASE_URL" as FieldKey, label: "Project URL", secret: false, required: true },
      { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY" as FieldKey, label: "Anon Key (public)", secret: false, required: true },
      { key: "SUPABASE_SERVICE_ROLE_KEY" as FieldKey, label: "Service Role Key", secret: true, required: false },
    ],
  },
  {
    title: "STRIPE",
    fields: [
      { key: "STRIPE_PUBLISHABLE_KEY" as FieldKey, label: "Publishable Key", secret: false, required: false },
      { key: "STRIPE_SECRET_KEY" as FieldKey, label: "Secret Key", secret: true, required: false },
      { key: "STRIPE_WEBHOOK_SECRET" as FieldKey, label: "Webhook Secret", secret: true, required: false },
    ],
  },
  {
    title: "ANTHROPIC",
    fields: [
      { key: "ANTHROPIC_API_KEY" as FieldKey, label: "API Key", secret: true, required: true },
    ],
  },
  {
    title: "PUSH NOTIFICATIES (VAPID)",
    fields: [
      { key: "VAPID_PUBLIC_KEY" as FieldKey, label: "Public Key", secret: false, required: false },
      { key: "VAPID_PRIVATE_KEY" as FieldKey, label: "Private Key", secret: true, required: false },
    ],
  },
  {
    title: "VERCEL (voor automatische deploys)",
    fields: [
      { key: "VERCEL_TOKEN" as FieldKey, label: "API Token", secret: true, required: false },
      { key: "VERCEL_PROJECT_ID" as FieldKey, label: "Project ID", secret: false, required: false },
      { key: "VERCEL_TEAM_ID" as FieldKey, label: "Team ID", secret: false, required: false },
    ],
  },
  {
    title: "GITHUB (voor code commits)",
    fields: [
      { key: "GITHUB_TOKEN" as FieldKey, label: "Personal Access Token", secret: true, required: false },
      { key: "GITHUB_USERNAME" as FieldKey, label: "Username", secret: false, required: false },
    ],
  },
  {
    title: "OPTIONEEL — Twilio (WhatsApp alerts)",
    optional: true,
    fields: [
      { key: "TWILIO_ACCOUNT_SID" as FieldKey, label: "Account SID", secret: false, required: false },
      { key: "TWILIO_AUTH_TOKEN" as FieldKey, label: "Auth Token", secret: true, required: false },
      { key: "TWILIO_PHONE_NUMBER" as FieldKey, label: "Phone Number", secret: false, required: false },
    ],
  },
];

const EMPTY = () => ({
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  STRIPE_PUBLISHABLE_KEY: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  ANTHROPIC_API_KEY: "",
  VAPID_PUBLIC_KEY: "",
  VAPID_PRIVATE_KEY: "",
  VERCEL_TOKEN: "",
  VERCEL_PROJECT_ID: "",
  VERCEL_TEAM_ID: "",
  GITHUB_TOKEN: "",
  GITHUB_USERNAME: "",
  TWILIO_ACCOUNT_SID: "",
  TWILIO_AUTH_TOKEN: "",
  TWILIO_PHONE_NUMBER: "",
} as Values);

const HIDDEN = () => Object.fromEntries(
  (Object.keys(EMPTY()) as FieldKey[]).map(k => [k, false])
) as Shown;

export default function SetupPage() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY());
  const [shown, setShown] = useState<Shown>(HIDDEN());
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, "pending" | "ok" | "error">>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingVapid, setGeneratingVapid] = useState(false);

  const set = (k: FieldKey, v: string) => setValues(prev => ({ ...prev, [k]: v }));
  const toggle = (k: FieldKey) => setShown(prev => ({ ...prev, [k]: !prev[k] }));

  const generateVapid = async () => {
    setGeneratingVapid(true);
    try {
      const res = await fetch("/api/os/setup/generate-vapid");
      const { publicKey, privateKey } = await res.json();
      setValues(prev => ({ ...prev, VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey }));
    } catch {
      alert("Fout bij genereren VAPID keys");
    } finally {
      setGeneratingVapid(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    setError(null);
    const required = SECTIONS.flatMap(s => s.fields.filter(f => f.required).map(f => f.key));
    const missing = required.filter(k => !values[k].trim());
    if (missing.length > 0) {
      setError(`Vul verplichte velden in: ${missing.join(", ")}`);
      return;
    }

    setLoading(true);
    // Animate statuses
    const allKeys = Object.keys(values) as FieldKey[];
    for (const k of allKeys) {
      if (values[k].trim()) {
        setStatuses(prev => ({ ...prev, [k]: "pending" }));
      }
    }

    try {
      const res = await fetch("/api/os/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Setup mislukt");

      // Toon succesvolle keys
      for (const k of allKeys) {
        if (values[k].trim()) {
          setTimeout(() => {
            setStatuses(prev => ({ ...prev, [k]: "ok" }));
          }, Math.random() * 800);
        }
      }

      setTimeout(() => {
        setDone(true);
        setTimeout(() => router.push("/os"), 2000);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
      setLoading(false);
    }
  }, [values, router]);

  if (done) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080808", display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <h2 style={{ color: "#22c55e", fontSize: 24, fontWeight: 700, margin: 0 }}>Configuratie compleet!</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>Doorsturen naar Servr OS...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080808", display: "flex",
      alignItems: "flex-start", justifyContent: "center", padding: "40px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 600 }}>
        {/* Header */}
        <div style={{
          border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden",
          marginBottom: 24,
        }}>
          <div style={{
            background: "#111", borderBottom: "1px solid #1f2937",
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <h1 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>
                SERVR OS — EERSTE CONFIGURATIE
              </h1>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                Voer je API keys in. Ze worden veilig opgeslagen in Vercel Environment Variables.
              </p>
            </div>
          </div>

          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 24 }}>
            {SECTIONS.map(section => (
              <div key={section.title}>
                <p style={{
                  margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                  color: section.optional ? "#4b5563" : "#9ca3af",
                }}>
                  {section.title}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {section.fields.map(field => (
                    <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ color: "#9ca3af", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                        {field.label}
                        {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                        {field.secret && <span style={{ color: "#6b7280" }}>🔒</span>}
                        {statuses[field.key] === "ok" && <span style={{ color: "#22c55e", marginLeft: "auto" }}>✅ Opgeslagen</span>}
                        {statuses[field.key] === "pending" && <span style={{ color: "#f59e0b", marginLeft: "auto" }}>⏳ Bezig...</span>}
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type={field.secret && !shown[field.key] ? "password" : "text"}
                          value={values[field.key]}
                          onChange={e => set(field.key, e.target.value)}
                          placeholder={field.key === "NEXT_PUBLIC_SUPABASE_URL" ? "https://xxx.supabase.co" : ""}
                          disabled={loading}
                          style={{
                            flex: 1, background: "#0d0d0d", border: "1px solid #1f2937",
                            borderRadius: 6, padding: "8px 10px", color: "#e5e7eb",
                            fontSize: 12, fontFamily: "monospace",
                            outline: "none",
                          }}
                        />
                        {field.secret && (
                          <button
                            onClick={() => toggle(field.key)}
                            style={{
                              background: "#1a1a1a", border: "1px solid #1f2937",
                              borderRadius: 6, padding: "0 10px", color: "#6b7280",
                              cursor: "pointer", fontSize: 12,
                            }}
                          >
                            {shown[field.key] ? "🙈" : "👁️"}
                          </button>
                        )}
                        {field.key === "VAPID_PUBLIC_KEY" && (
                          <button
                            onClick={generateVapid}
                            disabled={generatingVapid}
                            style={{
                              background: "#1a1a1a", border: "1px solid #1f2937",
                              borderRadius: 6, padding: "0 10px", color: "#6b7280",
                              cursor: "pointer", fontSize: 11, whiteSpace: "nowrap",
                            }}
                          >
                            {generatingVapid ? "..." : "Genereer"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div style={{
                background: "#1a0808", border: "1px solid #7f1d1d",
                borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 12,
              }}>
                ❌ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 8,
                background: loading ? "#1f2937" : "#7c3aed",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.05em", transition: "background 0.2s",
              }}
            >
              {loading ? "⏳ CONFIGUREREN..." : "⚡ CONFIGUREER ALLES"}
            </button>

            <p style={{ color: "#374151", fontSize: 11, textAlign: "center", margin: 0 }}>
              * Verplicht veld. Alle andere velden zijn optioneel maar worden aanbevolen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
