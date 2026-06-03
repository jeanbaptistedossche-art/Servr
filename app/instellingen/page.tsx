"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bell, Lock, Globe, Palette, Info, ChevronRight,
  LogOut, Trash2, Moon, Sun, Check, CreditCard, Plus, X,
  ShieldCheck, AlertTriangle,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useInstellingenStore, type BetaalMethodeType, type BetaalMethode } from "@/lib/instellingenStore";
import { useT, T } from "@/lib/translations";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt4(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function fmtExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function detectMerk(nr: string): "Visa" | "Mastercard" | "" {
  if (nr.startsWith("4")) return "Visa";
  if (nr.startsWith("5") || nr.startsWith("2")) return "Mastercard";
  return "";
}

function maskIBAN(raw: string): string {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  if (clean.length < 8) return clean;
  const land = clean.slice(0, 4);
  const eind = clean.slice(-2);
  return `${land} •••• •••• •••• ${eind}`;
}

// ─── toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label, desc, active, onChange,
}: { label: string; desc: string; active: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>{desc}</p>
      </div>
      <button
        onClick={onChange}
        className="touch-scale relative w-12 h-6 rounded-full flex-shrink-0 transition-all duration-200"
        style={{ background: active ? "#2B4030" : "#EDE4D2" }}>
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: active ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}

// ─── betaalmethode icoon ──────────────────────────────────────────────────────

function MethodeIcoon({ type, bankNaam }: { type: BetaalMethodeType; bankNaam?: string }) {
  if (type === "creditcard") return <CreditCard size={20} style={{ color: "#2B4030" }} />;
  if (type === "ideal") return <span className="text-xl">🏦</span>;
  if (type === "bancontact") return <span className="text-xl">🇧🇪</span>;
  return <span className="text-xl">🏛️</span>;
}

// ─── IDEALE banken ────────────────────────────────────────────────────────────

const IDEAL_BANKEN = ["ABN AMRO", "ING", "Rabobank", "SNS Bank", "Triodos Bank", "ASN Bank", "Bunq", "Knab", "RegioBank", "Revolut"];
const BANCONTACT_BANKEN = ["BNP Paribas Fortis", "KBC", "ING België", "Belfius", "Argenta", "Fintro"];

// ─── add-method modal ─────────────────────────────────────────────────────────

type AddFase = "type" | "details";

function AddMethodeModal({
  onClose, onSave, taal,
}: { onClose: () => void; onSave: (m: Omit<BetaalMethode, "id">) => void; taal: "nl" | "en" | "fr" }) {
  const t = useT(taal);
  const [fase, setFase] = useState<AddFase>("type");
  const [type, setType] = useState<BetaalMethodeType>("creditcard");

  // Creditcard
  const [kaartnummer, setKaartnummer] = useState("");
  const [kaarthouder, setKaarthouder] = useState("");
  const [vervaldatum, setVervaldatum] = useState("");
  const [cvv, setCvv] = useState("");

  // iDEAL / Bancontact
  const [bank, setBank] = useState("");

  // IBAN
  const [iban, setIban] = useState("");
  const [rekeninghouder, setRekeninghouder] = useState("");

  const TYPE_OPTIES = [
    { id: "creditcard" as BetaalMethodeType, label: t("creditcard"), sub: t("creditcardSub"), icoon: "💳" },
    { id: "ideal"      as BetaalMethodeType, label: t("ideal"),      sub: t("idealSub"),      icoon: "🏦" },
    { id: "bancontact" as BetaalMethodeType, label: t("bancontact"), sub: t("bancontactSub"), icoon: "🇧🇪" },
    { id: "iban"       as BetaalMethodeType, label: t("iban"),       sub: t("ibanSub"),       icoon: "🏛️" },
  ];

  const kanOpslaan = () => {
    if (type === "creditcard" || type === "bancontact") {
      const digits = kaartnummer.replace(/\s/g, "");
      return digits.length === 16 && kaarthouder.trim().length > 0 && vervaldatum.length === 5 && cvv.length === 3;
    }
    if (type === "ideal") return !!bank;
    if (type === "iban") {
      return iban.replace(/\s/g, "").length >= 10 && rekeninghouder.trim().length > 0;
    }
    return false;
  };

  const handleSave = () => {
    let methode: Omit<BetaalMethode, "id">;
    if (type === "creditcard") {
      const digits = kaartnummer.replace(/\s/g, "");
      const merk = detectMerk(digits);
      methode = {
        type: "creditcard",
        label: `${merk || "Kaart"} •••• ${digits.slice(-4)}`,
        icoon: "💳",
        last4: digits.slice(-4),
        kaarthouder,
        vervaldatum,
        kaartMerk: merk || "Kaart",
      };
    } else if (type === "ideal") {
      methode = { type: "ideal", label: `${bank} iDEAL`, icoon: "🏦", bankNaam: bank };
    } else if (type === "bancontact") {
      const digits = kaartnummer.replace(/\s/g, "");
      methode = {
        type: "bancontact",
        label: `Bancontact •••• ${digits.slice(-4)}`,
        icoon: "🇧🇪",
        last4: digits.slice(-4),
        kaarthouder,
        vervaldatum,
      };
    } else {
      methode = {
        type: "iban",
        label: maskIBAN(iban),
        icoon: "🏛️",
        ibanGemaskeerd: maskIBAN(iban),
        rekeninghouder,
      };
    }
    onSave(methode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}>
      <div
        className="w-full rounded-t-3xl p-5 animate-slide-up overflow-y-auto"
        style={{
          background: "#F5EFE5",
          maxHeight: "calc(100dvh - var(--bottom-nav-height) - 52px)",
          paddingBottom: "calc(var(--bottom-nav-height) + 16px)",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          {fase === "details" && (
            <button onClick={() => setFase("type")}
              className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#EDE4D2" }}>
              <ArrowLeft size={16} />
            </button>
          )}
          <h2 className="font-black text-lg flex-1">
            {fase === "type" ? t("kiesType") : t("gegevensInvullen")}
          </h2>
          <button onClick={onClose}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#EDE4D2" }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Fase 1: type kiezen ── */}
        {fase === "type" && (
          <div className="flex flex-col gap-3">
            {TYPE_OPTIES.map(opt => (
              <button key={opt.id} onClick={() => { setType(opt.id); setFase("details"); }}
                className="touch-scale flex items-center gap-4 p-4 rounded-2xl border-2 text-left"
                style={{ borderColor: "#E5DDD0", background: "#FBF7F0" }}>
                <span className="text-2xl flex-shrink-0">{opt.icoon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>{opt.sub}</p>
                </div>
                <ChevronRight size={16} style={{ color: "#8A8A83" }} />
              </button>
            ))}
          </div>
        )}

        {/* ── Fase 2: details invullen ── */}
        {fase === "details" && (
          <div className="flex flex-col gap-4">

            {/* CREDITCARD */}
            {type === "creditcard" && (
              <>
                {/* Kaart preview */}
                <div className="rounded-3xl p-5 mb-1 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", minHeight: 120 }}>
                  <p className="text-white/50 text-xs mb-4 font-mono">
                    {detectMerk(kaartnummer.replace(/\s/g, "")) || "CARD"}
                  </p>
                  <p className="text-white font-mono text-lg tracking-widest mb-4">
                    {kaartnummer || "•••• •••• •••• ••••"}
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase">Naam</p>
                      <p className="text-white text-sm font-semibold">{kaarthouder || "———"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-[10px] uppercase">Vervaldag</p>
                      <p className="text-white text-sm font-semibold">{vervaldatum || "MM/JJ"}</p>
                    </div>
                  </div>
                </div>

                <InputField label={t("kaartnummer")} placeholder={t("kaartnummerPlaceholder")}
                  value={kaartnummer} type="tel"
                  onChange={v => setKaartnummer(fmt4(v))} />
                <InputField label={t("kaarthouder")} placeholder={t("kaarthouderPlaceholder")}
                  value={kaarthouder}
                  onChange={setKaarthouder} />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t("vervaldatum")} placeholder={t("vervaldatumPlaceholder")}
                    value={vervaldatum} type="tel"
                    onChange={v => setVervaldatum(fmtExpiry(v))} />
                  <InputField label={t("cvv")} placeholder={t("cvvPlaceholder")}
                    value={cvv} type="tel" maxLength={3}
                    onChange={v => setCvv(v.replace(/\D/g, "").slice(0, 3))} />
                </div>
                <p className="text-xs flex items-center gap-1.5" style={{ color: "#8A8A83" }}>
                  <ShieldCheck size={12} style={{ color: "#2B4030" }} />
                  {t("cvvInfo")}
                </p>
              </>
            )}

            {/* iDEAL */}
            {type === "ideal" && (
              <BankKeuze banken={IDEAL_BANKEN} geselecteerd={bank} onSelect={setBank} label={t("kiesJouwBank")} />
            )}

            {/* Bancontact */}
            {type === "bancontact" && (
              <>
                {/* Bancontact card preview */}
                <div className="rounded-3xl p-5 mb-1 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #c0392b 0%, #922b21 55%, #641e16 100%)", minHeight: 120 }}>
                  <p className="text-white/60 text-xs mb-4 font-mono tracking-widest">BANCONTACT</p>
                  <p className="text-white font-mono text-lg tracking-widest mb-4">
                    {kaartnummer || "•••• •••• •••• ••••"}
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase">Naam</p>
                      <p className="text-white text-sm font-semibold">{kaarthouder || "———"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-[10px] uppercase">Vervaldag</p>
                      <p className="text-white text-sm font-semibold">{vervaldatum || "MM/JJ"}</p>
                    </div>
                  </div>
                </div>

                <InputField label={t("kaartnummer")} placeholder={t("kaartnummerPlaceholder")}
                  value={kaartnummer} type="tel"
                  onChange={v => setKaartnummer(fmt4(v))} />
                <InputField label={t("kaarthouder")} placeholder={t("kaarthouderPlaceholder")}
                  value={kaarthouder}
                  onChange={setKaarthouder} />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t("vervaldatum")} placeholder={t("vervaldatumPlaceholder")}
                    value={vervaldatum} type="tel"
                    onChange={v => setVervaldatum(fmtExpiry(v))} />
                  <InputField label={t("cvv")} placeholder={t("cvvPlaceholder")}
                    value={cvv} type="tel" maxLength={3}
                    onChange={v => setCvv(v.replace(/\D/g, "").slice(0, 3))} />
                </div>
                <p className="text-xs flex items-center gap-1.5" style={{ color: "#8A8A83" }}>
                  <ShieldCheck size={12} style={{ color: "#c0392b" }} />
                  {t("cvvInfo")}
                </p>
              </>
            )}

            {/* IBAN */}
            {type === "iban" && (
              <>
                <InputField label={t("ibanNummer")} placeholder={t("ibanNummerPlaceholder")}
                  value={iban}
                  onChange={v => setIban(v.toUpperCase())} />
                <InputField label={t("rekeninghouder")} placeholder={t("rekeninghouderPlaceholder")}
                  value={rekeninghouder}
                  onChange={setRekeninghouder} />
              </>
            )}

            {/* Opslaan */}
            <button
              onClick={handleSave}
              disabled={!kanOpslaan()}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-1"
              style={{ background: kanOpslaan() ? "#2B4030" : "#8A8A83" }}>
              {t("toevoegen")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function InputField({
  label, placeholder, value, onChange, type = "text", maxLength,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>
        {label}
      </label>
      <input
        type={type}
        inputMode={type === "tel" ? "numeric" : "text"}
        value={value}
        maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
        style={{
          borderColor: value ? "#2B4030" : "#E5DDD0",
          background: "#FBF7F0",
          color: "#1A1D1A",
        }}
      />
    </div>
  );
}

function BankKeuze({
  banken, geselecteerd, onSelect, label,
}: { banken: string[]; geselecteerd: string; onSelect: (b: string) => void; label: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase mb-3" style={{ color: "#8A8A83" }}>{label}</p>
      <div className="flex flex-col gap-2">
        {banken.map(b => (
          <button key={b} onClick={() => onSelect(b)}
            className="touch-scale flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 text-left transition-all"
            style={{
              borderColor: geselecteerd === b ? "#2B4030" : "#E5DDD0",
              background: geselecteerd === b ? "#2B4030" + "12" : "#FBF7F0",
            }}>
            <span className="font-semibold text-sm">{b}</span>
            {geselecteerd === b && <Check size={16} style={{ color: "#2B4030" }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function InstellingenPage() {
  const { logout } = useUserStore();
  const router = useRouter();
  const {
    darkMode, setDarkMode,
    taal, setTaal,
    toggles, setToggle,
    betaalmethoden, voegBetaalMethodeToe, verwijderBetaalMethode,
  } = useInstellingenStore();

  const t = useT(taal);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push("/onboarding");
  };

  const NOTIF_ROWS = [
    { key: "push_boeking",    label: t("nieuweBoeking"),    desc: t("nieuweBoekingSub") },
    { key: "push_bericht",    label: t("nieuweBerichten"),  desc: t("nieuweBerichtenSub") },
    { key: "push_betaling",   label: t("betalingen"),       desc: t("betalingenSub") },
    { key: "push_herinnering",label: t("herinneringen"),    desc: t("herinneringenSub") },
    { key: "email_nieuws",    label: t("nieuwsbrief"),      desc: t("nieuwsbriefSub") },
  ];

  const PRIVACY_ROWS = [
    { key: "locatie",          label: t("locatiedeling"),   desc: t("locatiedelingSub") },
    { key: "online_status",    label: t("onlineStatus"),    desc: t("onlineStatusSub") },
    { key: "profiel_zichtbaar",label: t("profielZichtbaar"),desc: t("profielZichtbaarSub") },
  ];

  const OVER_ITEMS = [
    { label: t("versie"),              value: "1.0.0 (build 42)" },
    { label: t("gebruikersvoorwaarden"), href: "/voorwaarden" },
    { label: t("privacybeleid"),        href: "/privacybeleid" },
    { label: t("cookieInstellingen"),   href: "/cookies" },
    { label: t("licenties"),            href: "/licenties" },
  ];

  return (
    <>
      <div className="flex flex-col min-h-full pb-10 animate-fade-in">

        {/* ── Header ── */}
        <div className="px-5 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10"
          style={{ background: "#F5EFE5", borderBottom: "1px solid #E5DDD0" }}>
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#EDE4D2" }}>
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-black text-xl flex-1">{t("instellingen")}</h1>
          <button onClick={handleSave}
            className="touch-scale px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
            style={{
              background: saved ? "#dcfce7" : "#2B4030" + "15",
              color: saved ? "#16a34a" : "#2B4030",
            }}>
            {saved ? <><Check size={12} /> {t("opgeslagen")}</> : t("opslaan")}
          </button>
        </div>

        <div className="px-5 flex flex-col gap-6 mt-5">

          {/* ─── NOTIFICATIES ─── */}
          <section>
            <SectionHeader icon={<Bell size={15} style={{ color: "#2B4030" }} />}
              bg="#2B4030" label={t("notificaties")} />
            <div className="card px-4 divide-y" style={{}}>
              {NOTIF_ROWS.map(r => (
                <ToggleRow key={r.key} label={r.label} desc={r.desc}
                  active={toggles[r.key] ?? false}
                  onChange={() => setToggle(r.key, !(toggles[r.key] ?? false))} />
              ))}
            </div>
          </section>

          {/* ─── PRIVACY ─── */}
          <section>
            <SectionHeader icon={<Lock size={15} style={{ color: "#7c3aed" }} />}
              bg="#7c3aed" label={t("privacy")} />
            <div className="card px-4 divide-y" style={{}}>
              {PRIVACY_ROWS.map(r => (
                <ToggleRow key={r.key} label={r.label} desc={r.desc}
                  active={toggles[r.key] ?? false}
                  onChange={() => setToggle(r.key, !(toggles[r.key] ?? false))} />
              ))}
            </div>
          </section>

          {/* ─── WEERGAVE ─── */}
          <section>
            <SectionHeader icon={<Palette size={15} style={{ color: "#d97706" }} />}
              bg="#d97706" label={t("weergave")} />
            <div className="card px-4">

              {/* Dark mode toggle */}
              <div className="flex items-center justify-between gap-3 py-3.5 border-b"
                style={{ borderColor: "#E5DDD0" }}>
                <div className="flex items-center gap-3">
                  {darkMode
                    ? <Moon size={16} style={{ color: "#2B4030" }} />
                    : <Sun size={16} style={{ color: "#d97706" }} />}
                  <div>
                    <p className="font-semibold text-sm">{t("donkerThema")}</p>
                    <p className="text-xs" style={{ color: "#8A8A83" }}>{t("donkerThemaSub")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="touch-scale relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                  style={{ background: darkMode ? "#2B4030" : "#EDE4D2" }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                    style={{ left: darkMode ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>

              {/* Taal */}
              <div className="py-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} style={{ color: "#8A8A83" }} />
                  <p className="font-semibold text-sm">{t("taalLabel")}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["nl", "en", "fr"] as const).map(l => {
                    const vlag = l === "nl" ? "🇳🇱" : l === "en" ? "🇬🇧" : "🇫🇷";
                    const naam = T[l]["taalLabel"];
                    return (
                      <button key={l} onClick={() => setTaal(l)}
                        className="touch-scale py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                        style={{
                          borderColor: taal === l ? "#2B4030" : "#E5DDD0",
                          background: taal === l ? "#2B4030" + "12" : "#FBF7F0",
                          color: taal === l ? "#2B4030" : "#1A1D1A",
                        }}>
                        {vlag} {naam}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ─── BETAALMETHODEN ─── */}
          <section>
            <SectionHeader icon={<CreditCard size={15} style={{ color: "#0ea5e9" }} />}
              bg="#0ea5e9" label={t("betaalmethoden")} />
            <div className="card overflow-hidden">
              {betaalmethoden.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-4">
                  <p className="text-sm flex-1" style={{ color: "#8A8A83" }}>
                    {t("geenBetaalmethoden")}
                  </p>
                </div>
              ) : (
                betaalmethoden.map((m, i) => (
                  <div key={m.id}
                    className="flex items-center gap-3 px-4 py-3.5 border-b"
                    style={{ borderColor: "#E5DDD0" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#EDE4D2" }}>
                      <MethodeIcoon type={m.type} bankNaam={m.bankNaam} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{m.label}</p>
                      {m.kaarthouder && (
                        <p className="text-xs" style={{ color: "#8A8A83" }}>{m.kaarthouder}</p>
                      )}
                      {m.vervaldatum && (
                        <p className="text-xs" style={{ color: "#8A8A83" }}>Verloopt {m.vervaldatum}</p>
                      )}
                      {m.rekeninghouder && (
                        <p className="text-xs" style={{ color: "#8A8A83" }}>{m.rekeninghouder}</p>
                      )}
                    </div>
                    <button
                      onClick={() => verwijderBetaalMethode(m.id)}
                      className="touch-scale w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#fee2e2" }}>
                      <Trash2 size={14} style={{ color: "#dc2626" }} />
                    </button>
                  </div>
                ))
              )}
              <button onClick={() => setShowAdd(true)}
                className="touch-scale flex items-center gap-3 px-4 py-4 w-full text-left"
                style={{ color: "#2B4030" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed flex-shrink-0"
                  style={{ borderColor: "#2B4030" }}>
                  <Plus size={14} />
                </div>
                <span className="font-semibold text-sm">{t("betaalmethodeToevoegen")}</span>
              </button>
            </div>
          </section>

          {/* ─── OVER SERVR ─── */}
          <section>
            <SectionHeader icon={<Info size={15} style={{ color: "#8A8A83" }} />}
              bg="#EDE4D2" label={t("overServr")} dark />
            <div className="card overflow-hidden">
              {OVER_ITEMS.map(item => (
                item.href
                  ? <Link key={item.label} href={item.href}
                      className="touch-scale flex items-center justify-between px-4 py-3.5 border-b last:border-0"
                      style={{ borderColor: "#E5DDD0" }}>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <ChevronRight size={15} style={{ color: "#8A8A83" }} />
                    </Link>
                  : <div key={item.label}
                      className="flex items-center justify-between px-4 py-3.5 border-b last:border-0"
                      style={{ borderColor: "#E5DDD0" }}>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <span className="text-xs" style={{ color: "#8A8A83" }}>{item.value}</span>
                    </div>
              ))}
            </div>
          </section>

          {/* ─── ACCOUNT VERWIJDEREN ─── */}
          <button onClick={() => setShowDeleteAccount(true)}
            className="touch-scale card p-4 flex items-center gap-3 w-full text-left"
            style={{ borderColor: "#fee2e2", background: "#fff5f5" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#fee2e2" }}>
              <Trash2 size={16} style={{ color: "#dc2626" }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "#dc2626" }}>{t("accountVerwijderen")}</p>
              <p className="text-xs" style={{ color: "#dc2626", opacity: 0.7 }}>{t("accountVerwijderenSub")}</p>
            </div>
            <ChevronRight size={15} style={{ color: "#dc2626" }} />
          </button>

          {/* Uitloggen */}
          <button onClick={handleLogout}
            className="touch-scale flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm"
            style={{ background: "#C97A4D" + "12", color: "#C97A4D" }}>
            <LogOut size={16} />
            {t("uitloggen")}
          </button>
        </div>
      </div>

      {/* ── Add betaalmethode modal ── */}
      {showAdd && (
        <AddMethodeModal
          taal={taal}
          onClose={() => setShowAdd(false)}
          onSave={(m) => {
            voegBetaalMethodeToe(m);
            setShowAdd(false);
          }}
        />
      )}

      {/* ── Account verwijderen bevestiging ── */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowDeleteAccount(false)}>
          <div className="w-full rounded-3xl p-6 animate-bounce-in"
            style={{ background: "#F5EFE5" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#fee2e2" }}>
              <AlertTriangle size={24} style={{ color: "#dc2626" }} />
            </div>
            <h2 className="font-black text-xl text-center mb-2">{t("accountVerwijderen")}</h2>
            <p className="text-sm text-center mb-6" style={{ color: "#8A8A83" }}>
              {t("accountVerwijderenSub")}. Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={deletingAccount}
                onClick={async () => {
                  setDeletingAccount(true);
                  try {
                    const { useUserStore } = await import("@/lib/store");
                    const userId = useUserStore.getState().userId;
                    if (userId) {
                      await fetch("/api/delete-account", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                      });
                    }
                    const { logout: authLogout } = await import("@/lib/auth");
                    await authLogout();
                  } catch { /* fallback: gewoon uitloggen */ }
                  router.push("/onboarding");
                }}
                className="touch-scale w-full py-3.5 rounded-2xl font-bold text-white"
                style={{ background: deletingAccount ? "#8A8A83" : "#dc2626" }}>
                {deletingAccount ? "Verwijderen..." : t("accountVerwijderen")}
              </button>
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="touch-scale w-full py-3.5 rounded-2xl font-bold border"
                style={{ borderColor: "#E5DDD0" }}>
                {t("annuleren")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── section header helper ────────────────────────────────────────────────────

function SectionHeader({
  icon, bg, label, dark,
}: { icon: React.ReactNode; bg: string; label: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: dark ? "#EDE4D2" : bg + "15" }}>
        {icon}
      </div>
      <h2 className="font-black text-base">{label}</h2>
    </div>
  );
}
