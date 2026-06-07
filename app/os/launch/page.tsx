"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Rocket, ExternalLink } from "lucide-react";
import type { CheckResult, LaunchReport } from "@/lib/launchChecker";

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: CheckResult["status"] }) {
  if (status === "pass") return <CheckCircle2 size={16} color="#10b981" />;
  if (status === "fail") return <XCircle size={16} color="#ef4444" />;
  return <AlertTriangle size={16} color="#f59e0b" />;
}

function StatusBol({ status }: { status: CheckResult["status"] }) {
  const color = status === "pass" ? "#10b981" : status === "fail" ? "#ef4444" : "#f59e0b";
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%", background: color,
      display: "inline-block", flexShrink: 0,
      boxShadow: status === "pass" ? `0 0 6px ${color}88` : undefined,
    }} />
  );
}

// ─── Launch modal ─────────────────────────────────────────────────────────────

function LaunchModal({ onClose }: { onClose: () => void }) {
  const [domein, setDomein] = useState("");
  const [ext, setExt] = useState(".be");
  const [launched, setLaunched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function goLive() {
    if (!domein.trim()) return;
    setLoading(true);
    const volledigDomein = `${domein.trim()}${ext}`;

    try {
      // Schrijf naar STATE.md en BACKLOG.md via de bestaande API
      const datum = new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });

      await fetch("/api/os/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "backlog",
          content: `\n## LAUNCH APPROVED\n- **Domein**: ${volledigDomein}\n- **Datum**: ${datum}\n- **Status**: Wacht op DNS configuratie\n`,
        }),
      });
    } catch { /* non-blocking */ }

    setLaunched(true);
    setLoading(false);
  }

  if (launched) {
    const volledigDomein = `${domein.trim()}${ext}`;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#111", border: "1px solid #1f2937", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%" }}>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>🚀</div>
          <h2 style={{ color: "#fff", fontFamily: "system-ui", fontSize: 22, fontWeight: 700, textAlign: "center", margin: "0 0 8px" }}>
            Launch goedgekeurd!
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", margin: "0 0 24px" }}>
            Domein: <strong style={{ color: "#3b82f6" }}>{volledigDomein}</strong>
          </p>

          <div style={{ background: "#0d0d0d", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <p style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>DNS configuratie in Vercel:</p>
            {[
              "1. Ga naar vercel.com → jouw project → Settings → Domains",
              `2. Voeg toe: ${volledigDomein}`,
              "3. Kopieer de nameservers die Vercel geeft",
              "4. Ga naar je domein registrar en update de nameservers",
              "5. Wacht 24-48u op DNS propagatie",
            ].map((stap, i) => (
              <p key={i} style={{ color: "#d1d5db", fontSize: 12, margin: "0 0 6px", lineHeight: 1.5 }}>{stap}</p>
            ))}
          </div>

          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 0", borderRadius: 10, background: "#1d4ed8", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none", marginBottom: 10 }}
          >
            <ExternalLink size={15} /> Open Vercel Dashboard
          </a>
          <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "transparent", border: "1px solid #1f2937", color: "#6b7280", cursor: "pointer", fontSize: 14 }}>
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#111", border: "1px solid #1f2937", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%" }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 16 }}>🚀</div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, textAlign: "center", margin: "0 0 4px" }}>
          Servr gaat live
        </h2>
        <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", margin: "0 0 24px" }}>
          Alle systemen groen. Kies jouw domein.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            value={domein}
            onChange={e => setDomein(e.target.value)}
            placeholder="servr"
            style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "#1a1a1a", border: "1px solid #1f2937", color: "#fff", fontSize: 15, outline: "none" }}
          />
          <select
            value={ext}
            onChange={e => setExt(e.target.value)}
            style={{ padding: "12px 12px", borderRadius: 10, background: "#1a1a1a", border: "1px solid #1f2937", color: "#9ca3af", fontSize: 14, cursor: "pointer" }}
          >
            <option>.be</option>
            <option>.com</option>
            <option>.nl</option>
            <option>.app</option>
          </select>
        </div>

        <button
          onClick={goLive}
          disabled={!domein.trim() || loading}
          style={{ width: "100%", padding: "14px 0", borderRadius: 10, background: domein.trim() ? "#16a34a" : "#1a1a1a", color: domein.trim() ? "#fff" : "#4b5563", fontWeight: 700, fontSize: 15, border: "none", cursor: domein.trim() ? "pointer" : "not-allowed", marginBottom: 10, transition: "background 0.15s" }}
        >
          {loading ? "Opslaan…" : "✓ Ja, gooi live"}
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "transparent", border: "1px solid #1f2937", color: "#6b7280", cursor: "pointer", fontSize: 14 }}>
          Nog even wachten
        </button>
      </div>
    </div>
  );
}

// ─── Hoofd component ──────────────────────────────────────────────────────────

export default function LaunchPage() {
  const [report, setReport] = useState<LaunchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "fail" | "pass">("all");

  const laadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/launch/check");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { laadReport(); }, [laadReport]);

  const gefilterd = report?.checks.filter(c => {
    if (activeFilter === "fail") return c.status === "fail";
    if (activeFilter === "pass") return c.status === "pass";
    return true;
  }) ?? [];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#080808", padding: "24px 20px 40px" }} className="os-scroll">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f9fafb", fontSize: 20, fontWeight: 700, margin: 0 }}>
            🚀 Launch Readiness
          </h1>
          <p style={{ color: "#4b5563", fontSize: 12, margin: "4px 0 0" }}>
            {report ? `${report.score}/${report.totaal} checks geslaagd · ${new Date(report.gegenereerd).toLocaleTimeString("nl-BE")}` : "Controleert…"}
          </p>
        </div>
        <button
          onClick={laadReport}
          disabled={loading}
          style={{ background: "none", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 12px", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "os-spin 1s linear infinite" : "none" }} />
          Hercheck
        </button>
      </div>

      {/* Score bar */}
      {report && (
        <div style={{ background: "#111", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ color: "#9ca3af", fontSize: 13 }}>Voortgang</span>
            <span style={{ color: "#f9fafb", fontSize: 18, fontWeight: 700 }}>
              {report.score}/{report.totaal}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "#1f2937", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(report.score / report.totaal) * 100}%`,
              background: report.klaarVoorLaunch ? "#10b981" : report.score / report.totaal > 0.6 ? "#f59e0b" : "#ef4444",
              borderRadius: 4,
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {[
              { label: "✓ Geslaagd", count: report.checks.filter(c => c.status === "pass").length, color: "#10b981" },
              { label: "✗ Mislukt", count: report.checks.filter(c => c.status === "fail").length, color: "#ef4444" },
              { label: "⚠ Waarschuwing", count: report.checks.filter(c => c.status === "warning").length, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>{s.count}</span>
                <span style={{ color: "#4b5563", fontSize: 11 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all", "fail", "pass"] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              fontSize: 11, padding: "4px 12px", borderRadius: 99, cursor: "pointer",
              background: activeFilter === f ? "#1e3a5f" : "transparent",
              border: `1px solid ${activeFilter === f ? "#1e3a8a" : "#1f2937"}`,
              color: activeFilter === f ? "#3b82f6" : "#4b5563",
            }}
          >
            {f === "all" ? "Alle" : f === "fail" ? "❌ Mislukt" : "✅ Geslaagd"}
          </button>
        ))}
      </div>

      {/* Checks list */}
      {error && (
        <div style={{ background: "#1f0000", border: "1px solid #ef4444", borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>❌ {error}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gefilterd.map(check => (
          <div key={check.id} style={{
            background: "#111",
            border: `1px solid ${check.status === "fail" ? "#3f0000" : check.status === "warning" ? "#2d2000" : "#0d2d1a"}`,
            borderLeft: `3px solid ${check.status === "fail" ? "#ef4444" : check.status === "warning" ? "#f59e0b" : "#10b981"}`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <StatusIcon status={check.status} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#f9fafb", fontSize: 13, fontWeight: 600, margin: 0 }}>{check.naam}</p>
                <p style={{ color: "#6b7280", fontSize: 11, margin: "3px 0 0" }}>{check.detail}</p>
                {check.fixInstructions && check.status !== "pass" && (
                  <p style={{ color: "#3b82f6", fontSize: 11, margin: "6px 0 0", fontStyle: "italic", lineHeight: 1.5 }}>
                    💡 {check.fixInstructions}
                  </p>
                )}
              </div>
              <StatusBol status={check.status} />
            </div>
          </div>
        ))}
      </div>

      {/* Launch knop */}
      {report && (
        <div style={{ marginTop: 28 }}>
          {report.klaarVoorLaunch ? (
            <div style={{ background: "#052e16", border: "1px solid #16a34a", borderRadius: 16, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
              <h2 style={{ color: "#4ade80", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>
                Servr is klaar voor launch!
              </h2>
              <p style={{ color: "#86efac", fontSize: 13, margin: "0 0 20px" }}>
                Alle systemen groen. De app werkt end-to-end.
              </p>
              <button
                onClick={() => setShowLaunchModal(true)}
                style={{ padding: "14px 32px", borderRadius: 12, background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(22,163,74,0.4)" }}
              >
                <Rocket size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
                Ja, gooi live
              </button>
            </div>
          ) : (
            <div style={{ background: "#111", border: "1px solid #1f2937", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                Fix de {report.checks.filter(c => c.status === "fail").length} rode checks hierboven om launch-klaar te zijn.
              </p>
            </div>
          )}
        </div>
      )}

      {showLaunchModal && <LaunchModal onClose={() => setShowLaunchModal(false)} />}
    </div>
  );
}
