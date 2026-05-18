"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CreditCard, FileText, Camera, CheckCircle, ChevronRight, Globe, ExternalLink, Loader2, Unlink } from "lucide-react";
import { MOCK_BEDRIJF, LANDEN, type Bedrijf, type LandCode } from "@/lib/bedrijfStore";
import { useStripeConnectStore } from "@/lib/stripeConnectStore";

type Tab = "algemeen" | "financieel" | "factuur";

// ─── helpers ──────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", prefix, hint, optional,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; prefix?: string; hint?: string; optional?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>{label}</label>
        {optional && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
            Optioneel
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border transition-colors"
        style={{ borderColor: value ? "var(--teal)" : "var(--border)", background: "var(--surface)" }}>
        {prefix && <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>{prefix}</span>}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--foreground)" }}
        />
        {value && <CheckCircle size={15} style={{ color: "var(--teal)", flexShrink: 0 }} />}
      </div>
      {hint && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{hint}</p>}
    </div>
  );
}

// ─── Landkiezer ───────────────────────────────────────────────────────────────

function LandKiezer({
  geselecteerd, onChange,
}: { geselecteerd: LandCode; onChange: (l: LandCode) => void }) {
  const [open, setOpen] = useState(false);
  const huidig = LANDEN[geselecteerd];

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
          Land van vestiging
        </label>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
          Bepaalt verplichte velden
        </span>
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className="touch-scale w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all"
        style={{ borderColor: "var(--teal)", background: "var(--surface)" }}>
        <span className="text-2xl">{huidig.vlag}</span>
        <span className="flex-1 font-semibold text-sm">{huidig.naam}</span>
        <Globe size={16} style={{ color: "var(--muted)" }} />
        <ChevronRight size={15}
          style={{
            color: "var(--muted)",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.2s",
          }} />
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1.5 rounded-2xl border overflow-hidden shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {(Object.entries(LANDEN) as [LandCode, typeof LANDEN[LandCode]][]).map(([code, cfg]) => (
            <button
              key={code}
              onClick={() => { onChange(code); setOpen(false); }}
              className="touch-scale w-full flex items-center gap-3 px-4 py-3.5 border-b last:border-0 transition-colors text-left"
              style={{
                borderColor: "var(--border)",
                background: geselecteerd === code ? "var(--teal)" + "0f" : "transparent",
              }}>
              <span className="text-xl">{cfg.vlag}</span>
              <span className="flex-1 text-sm font-semibold">{cfg.naam}</span>
              {geselecteerd === code && (
                <CheckCircle size={15} style={{ color: "var(--teal)" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function BedrijfPage() {
  const [bedrijf, setBedrijf] = useState<Bedrijf>(MOCK_BEDRIJF);
  const [tab, setTab] = useState<Tab>("algemeen");
  const [saved, setSaved] = useState(false);
  const { accountId, onboarded, setAccountId, reset } = useStripeConnectStore();
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Stripe Connect return: lees ?stripeAccountId= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("stripeAccountId");
    const refresh = params.get("stripeRefresh");
    if (sid) {
      setAccountId(sid);
      setTab("financieel");
      window.history.replaceState({}, "", "/bedrijf");
    } else if (refresh) {
      // Onboarding mislukt / verlopen — verwijder en opnieuw proberen
      setTab("financieel");
      window.history.replaceState({}, "", "/bedrijf");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof Bedrijf) => (v: string) =>
    setBedrijf(b => ({ ...b, [field]: v }));

  const setLand = (land: LandCode) => {
    // Bewaar BTW-percentage uit het nieuwe land als het beschikbaar is
    const cfg = LANDEN[land];
    const nieuwBtwPct = cfg.btwPercentages.includes(bedrijf.btw_percentage)
      ? bedrijf.btw_percentage
      : cfg.btwPercentages[cfg.btwPercentages.length - 1];
    setBedrijf(b => ({ ...b, land, btw_percentage: nieuwBtwPct }));
  };

  const save = async () => {
    await new Promise(r => setTimeout(r, 400));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const landCfg = LANDEN[bedrijf.land];

  const volledigheid = [
    bedrijf.naam,
    bedrijf.registratieNummer,
    landCfg.btw ? bedrijf.btw : "ok", // BTW is optioneel
    bedrijf.iban,
    bedrijf.email,
    bedrijf.telefoon,
    bedrijf.adres,
  ].filter(Boolean).length / 7 * 100;

  return (
    <div className="flex flex-col min-h-full pb-24 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <h1 className="text-white font-black text-xl flex-1">Bedrijfsprofiel</h1>
          <button onClick={save}
            className="touch-scale px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{ background: saved ? "rgba(255,255,255,0.3)" : "white", color: saved ? "white" : "var(--teal)" }}>
            {saved ? "✓ Opgeslagen!" : "Opslaan"}
          </button>
        </div>

        {/* Voortgang */}
        <div className="bg-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-xs font-semibold">Profiel volledigheid</p>
            <p className="text-white font-black text-sm">{Math.round(volledigheid)}%</p>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${volledigheid}%`, background: "white" }} />
          </div>
          {volledigheid < 100 && (
            <p className="text-white/60 text-xs mt-2">
              Vul alle gegevens in voor professionele offertes & facturen
            </p>
          )}
        </div>
      </div>

      {/* Logo upload */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center border-2 border-dashed"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <Building2 size={32} style={{ color: "var(--muted)" }} />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center touch-scale"
              style={{ background: "var(--teal)" }}>
              <Camera size={14} color="white" />
            </button>
          </div>
          <div>
            <p className="font-black text-base">{bedrijf.handelsnaam || "Jouw bedrijf"}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Logo voor professionele uitstraling</p>
            <button className="touch-scale mt-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
              Logo uploaden
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--surface-2)" }}>
          {([
            { id: "algemeen", icon: <Building2 size={14} />, label: "Algemeen" },
            { id: "financieel", icon: <CreditCard size={14} />, label: "Financieel" },
            { id: "factuur", icon: <FileText size={14} />, label: "Factuur" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="touch-scale flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tab === t.id ? "white" : "transparent",
                color: tab === t.id ? "var(--foreground)" : "var(--muted)",
                boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* ─── ALGEMEEN ─── */}
        {tab === "algemeen" && (
          <>
            {/* Stap 1: Land kiezen */}
            <LandKiezer geselecteerd={bedrijf.land} onChange={setLand} />

            <div className="h-px" style={{ background: "var(--border)" }} />

            {/* Bedrijfsnamen */}
            <Field label="Bedrijfsnaam (officieel)" value={bedrijf.naam} onChange={update("naam")}
              placeholder="Marco van den Berg Loodgietersbedrijf" />
            <Field label="Handelsnaam" value={bedrijf.handelsnaam} onChange={update("handelsnaam")}
              placeholder="Marco Loodgieter" hint="Naam die klanten zien op offertes" optional />

            <div className="h-px" style={{ background: "var(--border)" }} />

            {/* Land-specifieke registratie */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "var(--teal)" + "10", color: "var(--teal)" }}>
              <span>{landCfg.vlag}</span>
              <span>{landCfg.naam} — verplichte bedrijfsgegevens</span>
            </div>

            <Field
              label={landCfg.registratie.label}
              value={bedrijf.registratieNummer}
              onChange={update("registratieNummer")}
              placeholder={landCfg.registratie.placeholder}
              hint={landCfg.registratie.hint}
            />

            {landCfg.btw ? (
              <Field
                label={landCfg.btw.label}
                value={bedrijf.btw}
                onChange={update("btw")}
                placeholder={landCfg.btw.placeholder}
                hint={landCfg.btw.hint}
                optional
              />
            ) : (
              <div className="px-4 py-3 rounded-2xl text-xs"
                style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                Geen BTW-nummer vereist voor {landCfg.naam}
              </div>
            )}

            <div className="h-px" style={{ background: "var(--border)" }} />

            {/* Contact */}
            <Field label="E-mailadres" value={bedrijf.email} onChange={update("email")}
              type="email" placeholder="info@jouwbedrijf.nl" />
            <Field label="Telefoonnummer" value={bedrijf.telefoon} onChange={update("telefoon")}
              placeholder="+32 478 12 34 56" />
            <Field label="Website" value={bedrijf.website} onChange={update("website")}
              placeholder="www.jouwbedrijf.be" prefix="https://" optional />

            <div className="h-px" style={{ background: "var(--border)" }} />

            {/* Adres */}
            <Field label="Straat + huisnummer" value={bedrijf.adres} onChange={update("adres")}
              placeholder="Haarlemmerdijk 45" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Postcode" value={bedrijf.postcode} onChange={update("postcode")}
                placeholder={bedrijf.land === "BE" ? "9000" : bedrijf.land === "NL" ? "1013 KA" : "Postcode"} />
              <Field label="Stad" value={bedrijf.stad} onChange={update("stad")}
                placeholder={bedrijf.land === "BE" ? "Gent" : "Amsterdam"} />
            </div>
          </>
        )}

        {/* ─── FINANCIEEL ─── */}
        {tab === "financieel" && (
          <>
            {/* ── Stripe Connect sectie ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                  Online betalingen
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: onboarded ? "#dcfce7" : "var(--surface-2)", color: onboarded ? "#16a34a" : "var(--muted)" }}>
                  {onboarded ? "✓ Gekoppeld" : "Niet actief"}
                </span>
              </div>

              {onboarded && accountId ? (
                <div className="card p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#635BFF" + "15" }}>
                      <span className="text-lg">💳</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">Stripe account gekoppeld</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{accountId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl text-xs"
                    style={{ background: "var(--surface-2)" }}>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Jij ontvangt</span>
                      <span className="font-bold text-green-600">90% van elke betaling</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Servr commissie</span>
                      <span className="font-semibold">10%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => reset()}
                    className="touch-scale flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    <Unlink size={13} /> Ontkoppelen
                  </button>
                </div>
              ) : (
                <div className="card p-4 flex flex-col gap-3">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    Ontvang betalingen rechtstreeks op jouw rekening via Stripe.
                    Servr houdt <strong style={{ color: "var(--foreground)" }}>10% commissie</strong> in,
                    jij krijgt <strong style={{ color: "var(--foreground)" }}>90%</strong>.
                  </p>
                  {connectError && (
                    <div className="p-3 rounded-xl text-xs" style={{ background: "#fee2e2", color: "#dc2626" }}>
                      ⚠️ {connectError}
                    </div>
                  )}
                  <button
                    disabled={connectLoading}
                    onClick={async () => {
                      setConnectLoading(true);
                      setConnectError(null);
                      try {
                        const returnUrl = `${window.location.origin}/bedrijf`;
                        const res = await fetch("/api/stripe/connect", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ returnUrl }),
                        });
                        const data = await res.json();
                        if (!data.url) {
                          setConnectError(data.error ?? "Kan Stripe niet starten");
                          setConnectLoading(false);
                          return;
                        }
                        window.location.href = data.url;
                      } catch {
                        setConnectError("Kan Stripe niet bereiken");
                        setConnectLoading(false);
                      }
                    }}
                    className="touch-scale w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: connectLoading ? "var(--muted)" : "#635BFF" }}>
                    {connectLoading
                      ? <><Loader2 size={16} className="animate-spin" /> Openen…</>
                      : <><ExternalLink size={16} /> Koppel Stripe account</>
                    }
                  </button>
                  <p className="text-[11px] text-center" style={{ color: "var(--muted)" }}>
                    Je wordt doorgestuurd naar Stripe om je identiteit te bevestigen
                  </p>
                </div>
              )}
            </div>

            <div className="h-px" style={{ background: "var(--border)" }} />

            <div className="p-4 rounded-2xl" style={{ background: "var(--teal)" + "10" }}>
              <p className="font-bold text-sm mb-1" style={{ color: "var(--teal)" }}>🔒 Bankgegevens</p>
              <p className="text-xs" style={{ color: "var(--teal)" }}>
                Je IBAN verschijnt op facturen. Klanten betalen direct op jouw rekening. Servr houdt alleen de service fee in.
              </p>
            </div>
            <Field label="IBAN" value={bedrijf.iban} onChange={update("iban")}
              placeholder={bedrijf.land === "BE" ? "BE68 5390 0754 7034" : "NL91 ABNA 0417 1643 00"}
              hint="Je bankrekeningnummer" />
            <Field label="Bank" value={bedrijf.bankNaam} onChange={update("bankNaam")}
              placeholder={bedrijf.land === "BE" ? "BNP Paribas Fortis" : "ABN AMRO"} />

            <div className="h-px" style={{ background: "var(--border)" }} />

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                Betalingstermijn
              </label>
              <div className="flex gap-2">
                {[7, 14, 21, 30].map(d => (
                  <button key={d} onClick={() => setBedrijf(b => ({ ...b, betalingstermijn: d }))}
                    className="touch-scale flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all"
                    style={{
                      borderColor: bedrijf.betalingstermijn === d ? "var(--teal)" : "var(--border)",
                      background: bedrijf.betalingstermijn === d ? "var(--teal)" + "10" : "var(--surface)",
                      color: bedrijf.betalingstermijn === d ? "var(--teal)" : "var(--foreground)",
                    }}>
                    {d}d
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Klant heeft {bedrijf.betalingstermijn} dagen om de factuur te betalen
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                {landCfg.btw?.label.replace("nummer", "percentage").replace("Numéro", "%") ?? "BTW-percentage"}
              </label>
              <div className="flex gap-2 flex-wrap">
                {landCfg.btwPercentages.map(p => (
                  <button key={p} onClick={() => setBedrijf(b => ({ ...b, btw_percentage: p }))}
                    className="touch-scale flex-1 min-w-[60px] py-3 rounded-xl font-bold text-sm border-2 transition-all"
                    style={{
                      borderColor: bedrijf.btw_percentage === p ? "var(--teal)" : "var(--border)",
                      background: bedrijf.btw_percentage === p ? "var(--teal)" + "10" : "var(--surface)",
                      color: bedrijf.btw_percentage === p ? "var(--teal)" : "var(--foreground)",
                    }}>
                    {p}%
                  </button>
                ))}
              </div>
              {bedrijf.land === "BE" && (
                <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                  🇧🇪 België: 6% (voeding/bouw), 12% (catering), 21% (standaard)
                </p>
              )}
              {bedrijf.land === "NL" && (
                <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                  🇳🇱 NL: 9% (voeding/meds), 21% (standaard)
                </p>
              )}
            </div>
          </>
        )}

        {/* ─── FACTUUR INSTELLINGEN ─── */}
        {tab === "factuur" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Offerte prefix
                </label>
                <input value={bedrijf.offertePrefix} onChange={e => update("offertePrefix")(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Volgend nummer
                </label>
                <input value={bedrijf.offerteVolgNr} type="number"
                  onChange={e => setBedrijf(b => ({ ...b, offerteVolgNr: +e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Volgende offerte: <strong>{bedrijf.offertePrefix}{bedrijf.offerteVolgNr}</strong>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Factuur prefix
                </label>
                <input value={bedrijf.factuurPrefix} onChange={e => update("factuurPrefix")(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Volgend nummer
                </label>
                <input value={bedrijf.factuurVolgNr} type="number"
                  onChange={e => setBedrijf(b => ({ ...b, factuurVolgNr: +e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Volgende factuur: <strong>{bedrijf.factuurPrefix}{bedrijf.factuurVolgNr}</strong>
            </p>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                Voettekst (onderaan elke factuur)
              </label>
              <textarea value={bedrijf.footer} onChange={e => update("footer")(e.target.value)}
                rows={3} className="w-full px-4 py-3 rounded-2xl border outline-none text-sm resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
            </div>

            {/* Preview factuurkop */}
            <div className="card p-4">
              <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>Voorbeeld koptekst</p>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-base">{bedrijf.handelsnaam || bedrijf.naam}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{bedrijf.adres}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{bedrijf.postcode} {bedrijf.stad}</p>
                  {bedrijf.registratieNummer && (
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {LANDEN[bedrijf.land].registratie.label}: {bedrijf.registratieNummer}
                    </p>
                  )}
                  {bedrijf.btw && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {LANDEN[bedrijf.land].btw?.label}: {bedrijf.btw}
                    </p>
                  )}
                </div>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--teal)" }}>
                  <span className="text-white font-black text-xl">
                    {(bedrijf.handelsnaam || bedrijf.naam || "B").charAt(0)}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/offerte/maak"
              className="touch-scale flex items-center justify-between p-4 rounded-2xl"
              style={{ background: "var(--teal)" }}>
              <div>
                <p className="text-white font-bold text-sm">Maak een offerte</p>
                <p className="text-white/70 text-xs">Direct versturen naar klant</p>
              </div>
              <ChevronRight size={20} color="white" />
            </Link>
          </>
        )}
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5">
        <button onClick={save}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg"
          style={{ background: saved ? "#16a34a" : "var(--teal)", transition: "background 0.3s" }}>
          {saved ? "✓ Opgeslagen!" : "Wijzigingen opslaan"}
        </button>
      </div>
    </div>
  );
}
