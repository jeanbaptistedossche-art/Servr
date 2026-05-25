"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, TrendingDown, Euro, FileText, Car,
  Plus, X, Check, Download, AlertCircle, Camera, Fuel,
  Wrench, ShoppingBag, Wifi, MoreHorizontal, Receipt,
  Calculator, PiggyBank, Send, BarChart3, BookOpen, Globe,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import type { Land } from "@/lib/store";

// ── Land configuratie ─────────────────────────────────────────────────────────
const LAND_CFG = {
  NL: {
    naam: "Nederland", vlag: "🇳🇱",
    belastingdienst: "Belastingdienst",
    ondernemingLabel: "KvK-nummer",
    ondernemingFormat: "12345678",
    btwFormat: "NL123456789B01",
    btwTarieven: [21, 9, 0],
    btwAangifte: "Kwartaal",
    inkomstenbelasting: "Inkomstenbelasting (Box 1)",
    schijven: [
      { max: 38441,    tarief: 0.3697, label: "Schijf 1 — 36,97%", kleur: "#10B981" },
      { max: Infinity, tarief: 0.4950, label: "Schijf 2 — 49,50%", kleur: "#F59E0B" },
    ],
    aftrekposten: (winst: number) => {
      const zelfs = 5030;
      const mkb   = Math.round(Math.max(0, winst - zelfs) * 0.136);
      return [
        { naam: "Zelfstandigenaftrek", bedrag: zelfs, info: "Vaste aftrek voor ZZP-ers 2026" },
        { naam: "MKB-vrijstelling (13,6%)", bedrag: mkb, info: "13,6% van winst na zelfstandigenaftrek" },
      ];
    },
    socialeBijdragen: null as null | { naam: string; tarief: number; info: string },
    kmVergoeding: 0.23,
    kmLabel: "Zakelijke kilometers (€0,23/km)",
  },
  BE: {
    naam: "België", vlag: "🇧🇪",
    belastingdienst: "FOD Financiën",
    ondernemingLabel: "Ondernemingsnummer (KBO)",
    ondernemingFormat: "0123.456.789",
    btwFormat: "BE0123456789",
    btwTarieven: [21, 12, 6, 0],
    btwAangifte: "Kwartaal",
    inkomstenbelasting: "Personenbelasting",
    schijven: [
      { max: 15820,    tarief: 0.25,  label: "Schijf 1 — 25%",    kleur: "#10B981" },
      { max: 27920,    tarief: 0.40,  label: "Schijf 2 — 40%",    kleur: "#F59E0B" },
      { max: 48320,    tarief: 0.45,  label: "Schijf 3 — 45%",    kleur: "#EF4444" },
      { max: Infinity, tarief: 0.50,  label: "Schijf 4 — 50%",    kleur: "#7C3AED" },
    ],
    aftrekposten: (winst: number) => {
      const beroep = Math.min(Math.round(winst * 0.30), 5650);
      return [
        { naam: "Forfaitaire beroepskosten (30%)", bedrag: beroep, info: "Max €5.650 — of werkelijke kosten" },
      ];
    },
    socialeBijdragen: {
      naam: "Sociale bijdragen",
      tarief: 0.205,
      info: "~20,5% van netto-inkomen — kwartaalbijdragen aan sociaal verzekeringsfonds",
    },
    kmVergoeding: 0.4212,
    kmLabel: "Zakelijke kilometers (€0,4212/km)",
  },
  DE: {
    naam: "Deutschland", vlag: "🇩🇪",
    belastingdienst: "Finanzamt",
    ondernemingLabel: "Steuernummer",
    ondernemingFormat: "12/345/67890",
    btwFormat: "DE123456789",
    btwTarieven: [19, 7, 0],
    btwAangifte: "Kwartaal / Maand",
    inkomstenbelasting: "Einkommensteuer",
    schijven: [
      { max: 11604,    tarief: 0,     label: "Grundfreibetrag",     kleur: "#10B981" },
      { max: 61972,    tarief: 0.42,  label: "Schijf 1 — 14–42%",  kleur: "#F59E0B" },
      { max: Infinity, tarief: 0.45,  label: "Schijf 2 — 45%",     kleur: "#EF4444" },
    ],
    aftrekposten: (winst: number) => {
      const pausch = Math.min(Math.round(winst * 0.25), 2800);
      return [
        { naam: "Betriebsausgaben-Pauschale", bedrag: pausch, info: "25% pauschal, max €2.800" },
      ];
    },
    socialeBijdragen: {
      naam: "Kranken- & Rentenversicherung",
      tarief: 0.18,
      info: "~18% van inkomen voor zelfstandigen (schatting)",
    },
    kmVergoeding: 0.30,
    kmLabel: "Dienstliche Kilometer (€0,30/km)",
  },
  FR: {
    naam: "France", vlag: "🇫🇷",
    belastingdienst: "Direction Générale des Finances Publiques",
    ondernemingLabel: "SIRET-nummer",
    ondernemingFormat: "123 456 789 01234",
    btwFormat: "FR12345678901",
    btwTarieven: [20, 10, 5.5, 0],
    btwAangifte: "Kwartaal / Maand",
    inkomstenbelasting: "Impôt sur le revenu",
    schijven: [
      { max: 11294,    tarief: 0,     label: "Exonéré",             kleur: "#10B981" },
      { max: 28797,    tarief: 0.11,  label: "Tranche 1 — 11%",    kleur: "#10B981" },
      { max: 82341,    tarief: 0.30,  label: "Tranche 2 — 30%",    kleur: "#F59E0B" },
      { max: 177106,   tarief: 0.41,  label: "Tranche 3 — 41%",    kleur: "#EF4444" },
      { max: Infinity, tarief: 0.45,  label: "Tranche 4 — 45%",    kleur: "#7C3AED" },
    ],
    aftrekposten: (winst: number) => {
      const abatt = Math.min(Math.round(winst * 0.34), 7000);
      return [
        { naam: "Abattement micro-entreprise (34%)", bedrag: abatt, info: "Forfaitaire aftrek voor micro-ondernemer" },
      ];
    },
    socialeBijdragen: {
      naam: "Cotisations sociales",
      tarief: 0.22,
      info: "~22% van omzet voor micro-ondernemer",
    },
    kmVergoeding: 0.529,
    kmLabel: "Kilomètres professionnels (€0,529/km)",
  },
} as const;

type BtwStatus  = "betaald" | "openstaand" | "nog niet";
type UitgaveKat = "Materialen" | "Gereedschap" | "Brandstof" | "Verzekering" | "Marketing" | "Software" | "Overig";

type Uitgave = {
  id: string; datum: string; omschrijving: string;
  categorie: UitgaveKat; bedrag: number; aftrekbaar: boolean; bon?: string;
};
type Factuur = {
  id: string; klant: string; omschrijving: string;
  bedrag: number; btw: number; datum: string; status: "betaald" | "openstaand";
};
type Rit = { id: string; datum: string; bestemming: string; km: number; doel: string };

// ── Mock data ─────────────────────────────────────────────────────────────────
const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const OMZET_PER_MAAND = [2840, 3120, 2650, 4200, 3890, 0, 0, 0, 0, 0, 0, 0];

const MOCK_FACTUREN: Factuur[] = [
  { id:"f1",  klant:"Lisa de Vries",  omschrijving:"Lekkende kraan reparatie",    bedrag:75,  btw:15.75, datum:"2026-05-20", status:"betaald" },
  { id:"f2",  klant:"Ahmed Mansour", omschrijving:"CV ketel inspectie",           bedrag:95,  btw:19.95, datum:"2026-05-18", status:"betaald" },
  { id:"f3",  klant:"Petra Jansen",  omschrijving:"Woonkamer schilderen (45m²)", bedrag:520, btw:109.2, datum:"2026-05-14", status:"betaald" },
  { id:"f4",  klant:"Thomas Bakker", omschrijving:"Elektra groepenkast",          bedrag:180, btw:37.8,  datum:"2026-05-08", status:"openstaand" },
  { id:"f5",  klant:"Nora Smits",    omschrijving:"Badkamer tegels",              bedrag:340, btw:71.4,  datum:"2026-04-28", status:"betaald" },
  { id:"f6",  klant:"Jeroen Willems",omschrijving:"Dakgoot reinigen",             bedrag:120, btw:25.2,  datum:"2026-04-20", status:"betaald" },
  { id:"f7",  klant:"Sarah van Dam", omschrijving:"Vloer leggen (28m²)",          bedrag:680, btw:142.8, datum:"2026-04-10", status:"betaald" },
  { id:"f8",  klant:"Ravi Krishnan", omschrijving:"Kranen vervangen (2x)",        bedrag:145, btw:30.45, datum:"2026-03-28", status:"betaald" },
  { id:"f9",  klant:"Karin Meijer",  omschrijving:"Radiator bijvullen",           bedrag:65,  btw:13.65, datum:"2026-03-12", status:"betaald" },
  { id:"f10", klant:"Bram de Groot", omschrijving:"Stopcontacten plaatsen",       bedrag:210, btw:44.1,  datum:"2026-02-25", status:"betaald" },
];

const INIT_UITGAVEN: Uitgave[] = [
  { id:"u1", datum:"2026-05-19", omschrijving:"Koper pijpfittingen",     categorie:"Materialen",  bedrag:67,  aftrekbaar:true },
  { id:"u2", datum:"2026-05-16", omschrijving:"Brandstof mei",           categorie:"Brandstof",   bedrag:131, aftrekbaar:true },
  { id:"u3", datum:"2026-05-10", omschrijving:"Servr abonnement",        categorie:"Software",    bedrag:29,  aftrekbaar:true },
  { id:"u4", datum:"2026-05-05", omschrijving:"Verfroller + kwast set",  categorie:"Gereedschap", bedrag:44,  aftrekbaar:true },
  { id:"u5", datum:"2026-04-22", omschrijving:"Beroepsaansprakelijkheid",categorie:"Verzekering", bedrag:180, aftrekbaar:true },
  { id:"u6", datum:"2026-04-15", omschrijving:"Afdichtingsband bulk",    categorie:"Materialen",  bedrag:38,  aftrekbaar:true },
  { id:"u7", datum:"2026-04-08", omschrijving:"Google Ads april",        categorie:"Marketing",   bedrag:50,  aftrekbaar:true },
  { id:"u8", datum:"2026-03-20", omschrijving:"Accu-schroefmachine",     categorie:"Gereedschap", bedrag:189, aftrekbaar:true },
  { id:"u9", datum:"2026-03-08", omschrijving:"Brandstof mrt",           categorie:"Brandstof",   bedrag:118, aftrekbaar:true },
];

const INIT_RITTEN: Rit[] = [
  { id:"r1", datum:"2026-05-20", bestemming:"Lisa de Vries, Jordaan",    km:4.2,  doel:"Klus: kraan reparatie" },
  { id:"r2", datum:"2026-05-18", bestemming:"Ahmed Mansour, De Pijp",    km:7.8,  doel:"Klus: CV ketel" },
  { id:"r3", datum:"2026-05-14", bestemming:"Petra Jansen, Oud-West",    km:5.5,  doel:"Klus: schilderwerk" },
  { id:"r4", datum:"2026-05-08", bestemming:"Thomas Bakker, Noord",      km:11.2, doel:"Klus: elektra" },
  { id:"r5", datum:"2026-04-28", bestemming:"Nora Smits, Oost",          km:8.6,  doel:"Klus: tegels" },
  { id:"r6", datum:"2026-04-20", bestemming:"Bouwmarkt",                 km:22.0, doel:"Materialen inkopen" },
];

const BTW_KWARTALEN_BASE = [
  { kwartaal:"Q1 2026", periode:"Jan–Mrt", omzet:8610,  status:"betaald"    as BtwStatus },
  { kwartaal:"Q2 2026", periode:"Apr–Jun", omzet:8090,  status:"openstaand" as BtwStatus },
  { kwartaal:"Q3 2026", periode:"Jul–Sep", omzet:0,     status:"nog niet"   as BtwStatus },
  { kwartaal:"Q4 2026", periode:"Okt–Dec", omzet:0,     status:"nog niet"   as BtwStatus },
];

const KAT_COLORS: Record<UitgaveKat,string> = {
  Materialen:"#3B82F6", Gereedschap:"#F59E0B", Brandstof:"#10B981",
  Verzekering:"#8B5CF6", Marketing:"#EC4899", Software:"#06B6D4", Overig:"#94A3B8",
};
const KAT_ICONS: Record<UitgaveKat, React.ReactNode> = {
  Materialen:<ShoppingBag size={14}/>, Gereedschap:<Wrench size={14}/>,
  Brandstof:<Fuel size={14}/>, Verzekering:<Check size={14}/>,
  Marketing:<BarChart3 size={14}/>, Software:<Wifi size={14}/>, Overig:<MoreHorizontal size={14}/>,
};
const BTW_ST: Record<BtwStatus,{bg:string;color:string;label:string}> = {
  betaald:   {bg:"#dcfce7",color:"#16a34a",label:"✓ Betaald"},
  openstaand:{bg:"#fef3c7",color:"#d97706",label:"! Openstaand"},
  "nog niet":{bg:"#f1f5f9",color:"#94a3b8",label:"Nog niet"},
};

function fmt(n:number,d=2){return n.toLocaleString("nl-NL",{minimumFractionDigits:d,maximumFractionDigits:d});}

type Tab = "overzicht"|"inkomsten"|"uitgaven"|"btw"|"belasting"|"kilometers";

// ── Belasting berekenen voor elk land ────────────────────────────────────────
function berekenBelasting(netto: number, cfg: typeof LAND_CFG[Land]) {
  const aftrekList = cfg.aftrekposten(netto);
  const totaalAftrek = aftrekList.reduce((s,a) => s + a.bedrag, 0);
  const belastbaar = Math.max(0, netto - totaalAftrek);

  let belasting = 0;
  let prev = 0;
  for (const schijf of cfg.schijven) {
    const deel = Math.min(belastbaar, schijf.max) - prev;
    if (deel > 0) belasting += deel * schijf.tarief;
    prev = schijf.max === Infinity ? belastbaar : schijf.max;
    if (prev >= belastbaar) break;
  }

  const sociaal = cfg.socialeBijdragen
    ? Math.round(netto * cfg.socialeBijdragen.tarief)
    : 0;

  return { aftrekList, totaalAftrek, belastbaar, belasting: Math.round(belasting), sociaal };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BoekhoudingPage() {
  const storeLand = useUserStore(s => s.land);
  const setStoreLand = useUserStore(s => s.setLand);

  const [activeTab, setActiveTab]   = useState<Tab>("overzicht");
  const [uitgaven, setUitgaven]     = useState<Uitgave[]>(INIT_UITGAVEN);
  const [ritten, setRitten]         = useState<Rit[]>(INIT_RITTEN);
  const [showAddU, setShowAddU]     = useState(false);
  const [showAddR, setShowAddR]     = useState(false);
  const [showLand, setShowLand]     = useState(false);
  const [showBtwModal, setShowBtwModal] = useState<number|null>(null);
  const [ingediend, setIngediend]   = useState<number[]>([0]);
  const bonRef = useRef<HTMLInputElement>(null);

  // Uitgave form
  const [nuOms, setNuOms]     = useState("");
  const [nuBed, setNuBed]     = useState("");
  const [nuKat, setNuKat]     = useState<UitgaveKat>("Materialen");
  const [nuDat, setNuDat]     = useState(new Date().toISOString().split("T")[0]);
  const [nuBon, setNuBon]     = useState("");

  // Rit form
  const [rDat, setRDat]       = useState(new Date().toISOString().split("T")[0]);
  const [rBest, setRBest]     = useState("");
  const [rKm, setRKm]         = useState("");
  const [rDoel, setRDoel]     = useState("");

  const cfg = LAND_CFG[storeLand];
  const btwTarief = cfg.btwTarieven[0] / 100;

  // Berekeningen
  const totOmzet   = MOCK_FACTUREN.filter(f=>f.status==="betaald").reduce((s,f)=>s+f.bedrag,0);
  const openOmzet  = MOCK_FACTUREN.filter(f=>f.status==="openstaand").reduce((s,f)=>s+f.bedrag,0);
  const totUitg    = uitgaven.reduce((s,u)=>s+u.bedrag,0);
  const aftrekKost = uitgaven.filter(u=>u.aftrekbaar).reduce((s,u)=>s+u.bedrag,0);
  const netto      = totOmzet - aftrekKost;
  const totBtwOntvangen = MOCK_FACTUREN.filter(f=>f.status==="betaald").reduce((s,f)=>s+f.btw,0);
  const totKm      = ritten.reduce((s,r)=>s+r.km,0);
  const kmVerg     = totKm * cfg.kmVergoeding;
  const maxOmzet   = Math.max(...OMZET_PER_MAAND.filter(v=>v>0),1);

  const { aftrekList, belastbaar, belasting, sociaal } = berekenBelasting(netto, cfg);
  const totaalBelastingDruk = belasting + sociaal;
  const reservePerMaand = Math.round(totaalBelastingDruk / 12);

  const openBtw = BTW_KWARTALEN_BASE
    .filter((_,i) => !ingediend.includes(i) && BTW_KWARTALEN_BASE[i].status==="openstaand")
    .reduce((s,q) => s + Math.round(q.omzet * btwTarief), 0);

  const TABS: {key:Tab;label:string;icon:React.ReactNode}[] = [
    {key:"overzicht", label:"Overzicht",  icon:<BarChart3 size={13}/>},
    {key:"inkomsten", label:"Inkomsten",  icon:<TrendingUp size={13}/>},
    {key:"uitgaven",  label:"Uitgaven",   icon:<TrendingDown size={13}/>},
    {key:"btw",       label:"BTW",        icon:<Receipt size={13}/>},
    {key:"belasting", label:"Belasting",  icon:<Calculator size={13}/>},
    {key:"kilometers",label:"Kilometers", icon:<Car size={13}/>},
  ];

  const saveUitgave = () => {
    if (!nuOms.trim()||!nuBed) return;
    setUitgaven(p=>[{id:`u${Date.now()}`,datum:nuDat,omschrijving:nuOms,categorie:nuKat,bedrag:parseFloat(nuBed),aftrekbaar:true,bon:nuBon||undefined},...p]);
    setNuOms(""); setNuBed(""); setNuBon(""); setShowAddU(false);
  };
  const saveRit = () => {
    if (!rBest.trim()||!rKm) return;
    setRitten(p=>[{id:`r${Date.now()}`,datum:rDat,bestemming:rBest,km:parseFloat(rKm),doel:rDoel},...p]);
    setRBest(""); setRKm(""); setRDoel(""); setShowAddR(false);
  };

  const exportData = () => {
    const fmtEurLocal = (n: number) =>
      new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
    const now = new Date().toLocaleDateString("nl-NL");
    let csv = "";

    if (activeTab === "inkomsten") {
      csv = "Datum;Klant;Omschrijving;Bedrag ex BTW;BTW;Status\n";
      csv += MOCK_FACTUREN.map(f =>
        `${f.datum};${f.klant};"${f.omschrijving}";${fmt(f.bedrag)};${fmt(f.btw)};${f.status}`
      ).join("\n");
    } else if (activeTab === "uitgaven") {
      csv = "Datum;Omschrijving;Categorie;Bedrag;Aftrekbaar\n";
      csv += uitgaven.map(u =>
        `${u.datum};"${u.omschrijving}";${u.categorie};${fmt(u.bedrag)};${u.aftrekbaar ? "Ja" : "Nee"}`
      ).join("\n");
    } else if (activeTab === "kilometers") {
      csv = "Datum;Bestemming;Km;Doel;Vergoeding\n";
      csv += ritten.map(r =>
        `${r.datum};"${r.bestemming}";${fmt(r.km,1)};"${r.doel}";${fmt(r.km * cfg.kmVergoeding)}`
      ).join("\n");
    } else {
      // Overzicht export — alles samen
      csv = `Servr Boekhouding Export – ${now}\n`;
      csv += `Land;${cfg.naam}\nBoekjaar;2026\n\n`;
      csv += `INKOMSTEN\nDatum;Klant;Omschrijving;Bedrag;BTW;Status\n`;
      csv += MOCK_FACTUREN.map(f =>
        `${f.datum};${f.klant};"${f.omschrijving}";${fmt(f.bedrag)};${fmt(f.btw)};${f.status}`
      ).join("\n");
      csv += `\n\nUITGAVEN\nDatum;Omschrijving;Categorie;Bedrag\n`;
      csv += uitgaven.map(u =>
        `${u.datum};"${u.omschrijving}";${u.categorie};${fmt(u.bedrag)}`
      ).join("\n");
      csv += `\n\nKILOMETERS\nDatum;Bestemming;Km;Vergoeding\n`;
      csv += ritten.map(r =>
        `${r.datum};"${r.bestemming}";${fmt(r.km,1)};${fmt(r.km * cfg.kmVergoeding)}`
      ).join("\n");
      csv += `\n\nSAMENVATTING\nOmzet betaald;${fmt(totOmzet)}\nTotaal uitgaven;${fmt(totUitg)}\nNetto winst;${fmt(netto)}\n`;
    }

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servr-boekhouding-${activeTab}-${now.replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-full" style={{background:"#F1F4FA"}}>

      {/* Header */}
      <div className="px-5 pt-14 pb-3 sticky top-0 z-20"
        style={{background:"#F1F4FA",borderBottom:"1px solid #E2E8F0"}}>
        <div className="flex items-center gap-3 mb-3">
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0">
            <ArrowLeft size={18}/>
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-2xl">Boekhouding</h1>
            <p className="text-xs" style={{color:"#64748B"}}>Boekjaar 2026</p>
          </div>
          {/* Land selector */}
          <button onClick={()=>setShowLand(v=>!v)}
            className="touch-scale flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white shadow-sm text-xs font-bold relative whitespace-nowrap flex-shrink-0">
            <span className="text-sm leading-none">{cfg.vlag}</span>
            <span>{storeLand}</span>
          </button>
          <button onClick={exportData}
            className="touch-scale w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm flex-shrink-0"
            style={{color:"#4F46E5"}} title="Export CSV">
            <Download size={16}/>
          </button>
        </div>

        {/* Land dropdown */}
        {showLand && (
          <div className="absolute right-4 top-16 z-30 rounded-2xl overflow-hidden shadow-xl"
            style={{background:"white",border:"1px solid #E2E8F0",minWidth:220}}>
            {(Object.keys(LAND_CFG) as Land[]).map(l => (
              <button key={l} onClick={()=>{setStoreLand(l);setShowLand(false);}}
                className="touch-scale w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                style={{borderBottom:"1px solid #F1F5F9",background:storeLand===l?"#EEF2FF":"white"}}>
                <span className="text-lg">{LAND_CFG[l].vlag}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{LAND_CFG[l].naam}</p>
                  <p className="text-[10px]" style={{color:"#94A3B8"}}>{LAND_CFG[l].belastingdienst}</p>
                </div>
                {storeLand===l && <Check size={14} style={{color:"#4F46E5"}}/>}
              </button>
            ))}
          </div>
        )}

        {/* Land info strip */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
          style={{background:"#4F46E510",border:"1px solid #4F46E520"}}>
          <span className="text-base">{cfg.vlag}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{cfg.naam} — {cfg.belastingdienst}</p>
            <p className="text-[10px]" style={{color:"#64748B"}}>
              {cfg.ondernemingLabel} · BTW {cfg.btwTarieven.join("/")}% · {cfg.btwAangifte}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={{
                background:activeTab===t.key?"#4F46E5":"white",
                color:activeTab===t.key?"white":"#64748B",
                boxShadow:activeTab===t.key?"0 2px 8px #4F46E540":"0 1px 3px rgba(0,0,0,0.06)",
              }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 pb-24">

        {/* ══ OVERZICHT ══ */}
        {activeTab==="overzicht" && (<>
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:"Omzet (excl. BTW)", value:`€${fmt(totOmzet)}`,    color:"#10B981", icon:<TrendingUp size={16} color="#10B981"/>},
              {label:"Totale kosten",     value:`€${fmt(totUitg)}`,     color:"#EF4444", icon:<TrendingDown size={16} color="#EF4444"/>},
              {label:"Netto winst",       value:`€${fmt(netto)}`,        color:"#4F46E5", icon:<Euro size={16} color="#4F46E5"/>},
              {label:"Openstaande BTW",   value:`€${fmt(openBtw)}`,     color:"#F59E0B", icon:<Receipt size={16} color="#F59E0B"/>},
            ].map(s=>(
              <div key={s.label} className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                  style={{background:s.color+"15"}}>{s.icon}</div>
                <p className="font-black text-xl" style={{color:s.color}}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>{s.label}</p>
              </div>
            ))}
          </div>

          {openOmzet>0 && (
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3"
              style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:"1px solid #FEF3C7"}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"#FEF3C7"}}>
                <AlertCircle size={17} style={{color:"#D97706"}}/>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">€{fmt(openOmzet)} openstaand</p>
                <p className="text-xs" style={{color:"#94A3B8"}}>Nog niet betaalde facturen</p>
              </div>
              <button onClick={()=>setActiveTab("inkomsten")}
                className="touch-scale text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{background:"#FEF3C7",color:"#D97706"}}>Bekijk</button>
            </div>
          )}

          {/* Grafiek */}
          <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <p className="font-bold text-sm mb-4">Omzet per maand 2026</p>
            <div className="flex items-end gap-1 h-28">
              {OMZET_PER_MAAND.map((v,i)=>(
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md"
                    style={{
                      height:v>0?`${Math.round((v/maxOmzet)*96)}px`:"4px",
                      background:v>0?(i===4?"linear-gradient(180deg,#4F46E5,#818CF8)":"#E0E7FF"):"#F1F5F9",
                      minHeight:4,
                    }}/>
                  <span className="text-[9px] font-semibold" style={{color:v>0?"#64748B":"#CBD5E1"}}>{MAANDEN[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* W&V rekening */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sm">Winst- & verliesrekening 2026</p>
              <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>{cfg.naam} — {cfg.belastingdienst}</p>
            </div>
            {[
              {label:"Omzet (excl. BTW)",    value:totOmzet,     color:"#10B981", plus:true},
              {label:"Aftrekbare kosten",     value:-aftrekKost,  color:"#EF4444", plus:false},
              {label:"Bruto winst",           value:netto,        color:"#4F46E5", plus:true, bold:true},
              ...aftrekList.map(a=>({label:a.naam, value:-a.bedrag, color:"#6366F1", plus:false})),
              {label:"Belastbaar inkomen",    value:belastbaar,   color:"#0F172A", plus:true, bold:true},
            ].map((r,i)=>(
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                <p className="text-sm" style={{fontWeight:r.bold?700:400,color:r.bold?"#0F172A":"#64748B"}}>{r.label}</p>
                <p className="text-sm font-bold" style={{color:r.color}}>
                  {r.plus?"+":"−"}€{fmt(Math.abs(r.value))}
                </p>
              </div>
            ))}
            {cfg.socialeBijdragen && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                <p className="text-sm" style={{color:"#64748B"}}>{cfg.socialeBijdragen.naam}</p>
                <p className="text-sm font-bold" style={{color:"#EF4444"}}>−€{fmt(sociaal)}</p>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3" style={{background:"#F8FAFC"}}>
              <p className="font-black text-sm">Totale belastingdruk</p>
              <p className="font-black text-sm" style={{color:"#EF4444"}}>−€{fmt(totaalBelastingDruk)}</p>
            </div>
          </div>

          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{background:"#4F46E510",border:"1px solid #4F46E530"}}>
            <PiggyBank size={18} style={{color:"#4F46E5",flexShrink:0,marginTop:2}}/>
            <div>
              <p className="font-bold text-sm">Reserveer elke maand €{fmt(reservePerMaand,0)}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{color:"#64748B"}}>
                Geschatte jaarlijkse belasting: €{fmt(totaalBelastingDruk,0)} ({cfg.naam}).
                Zet dit maandelijks apart om verrassingen te vermijden.
              </p>
            </div>
          </div>
        </>)}

        {/* ══ INKOMSTEN ══ */}
        {activeTab==="inkomsten" && (<>
          <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-semibold" style={{color:"#94A3B8"}}>Totaal ontvangen</p>
                <p className="font-black text-2xl" style={{color:"#10B981"}}>€{fmt(totOmzet)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold" style={{color:"#94A3B8"}}>Openstaand</p>
                <p className="font-black text-xl" style={{color:"#F59E0B"}}>€{fmt(openOmzet)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            {MOCK_FACTUREN.map((f,i)=>(
              <div key={f.id} className={`flex items-center gap-3 px-4 py-3.5 ${i<MOCK_FACTUREN.length-1?"border-b border-gray-50":""}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:f.status==="betaald"?"#F0FDF4":"#FEF3C7"}}>
                  <FileText size={16} style={{color:f.status==="betaald"?"#16A34A":"#D97706"}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{f.omschrijving}</p>
                  <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>
                    {f.klant} · {new Date(f.datum).toLocaleDateString("nl-NL",{day:"numeric",month:"short"})}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm">€{fmt(f.bedrag)}</p>
                  <p className="text-[10px]" style={{color:"#94A3B8"}}>+BTW €{fmt(f.btw)}</p>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ══ UITGAVEN ══ */}
        {activeTab==="uitgaven" && (<>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
              <p className="text-xs font-semibold mb-1" style={{color:"#94A3B8"}}>Totale kosten</p>
              <p className="font-black text-xl" style={{color:"#EF4444"}}>€{fmt(totUitg)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
              <p className="text-xs font-semibold mb-1" style={{color:"#94A3B8"}}>Aftrekbaar</p>
              <p className="font-black text-xl" style={{color:"#10B981"}}>€{fmt(aftrekKost)}</p>
            </div>
          </div>

          {/* Categorieën */}
          <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <p className="font-bold text-sm mb-3">Per categorie</p>
            {(Object.keys(KAT_COLORS) as UitgaveKat[]).map(kat=>{
              const total=uitgaven.filter(u=>u.categorie===kat).reduce((s,u)=>s+u.bedrag,0);
              if(!total) return null;
              const pct=Math.round((total/totUitg)*100);
              return (
                <div key={kat} className="mb-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{background:KAT_COLORS[kat]+"18",color:KAT_COLORS[kat]}}>{KAT_ICONS[kat]}</span>
                      <span className="text-xs font-semibold">{kat}</span>
                    </div>
                    <span className="text-xs font-bold">€{fmt(total)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{background:"#F1F5F9"}}>
                    <div className="h-1.5 rounded-full" style={{width:`${pct}%`,background:KAT_COLORS[kat]}}/>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sm">Alle uitgaven</p>
              <button onClick={()=>setShowAddU(true)}
                className="touch-scale flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{background:"#EF444410",color:"#EF4444"}}>
                <Plus size={12}/> Toevoegen
              </button>
            </div>
            {uitgaven.map((u,i)=>(
              <div key={u.id} className={`flex items-center gap-3 px-4 py-3 ${i<uitgaven.length-1?"border-b border-gray-50":""}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:KAT_COLORS[u.categorie]+"15",color:KAT_COLORS[u.categorie]}}>
                  {KAT_ICONS[u.categorie]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{u.omschrijving}</p>
                  <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>
                    {u.categorie} · {new Date(u.datum).toLocaleDateString("nl-NL",{day:"numeric",month:"short"})}
                  </p>
                </div>
                <p className="font-bold text-sm flex-shrink-0" style={{color:"#EF4444"}}>−€{fmt(u.bedrag)}</p>
              </div>
            ))}
          </div>
        </>)}

        {/* ══ BTW ══ */}
        {activeTab==="btw" && (<>
          <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <p className="text-xs font-semibold mb-1" style={{color:"#94A3B8"}}>
              Totale BTW ontvangen 2026 ({cfg.naam})
            </p>
            <p className="font-black text-2xl" style={{color:"#F59E0B"}}>€{fmt(totBtwOntvangen)}</p>
            <p className="text-xs mt-1" style={{color:"#94A3B8"}}>
              Standaard tarief: {cfg.btwTarieven[0]}% · Overige: {cfg.btwTarieven.slice(1).join("/")}%
            </p>
          </div>

          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{background:"#FEF3C720",border:"1px solid #FEF3C7"}}>
            <BookOpen size={16} style={{color:"#D97706",flexShrink:0,marginTop:2}}/>
            <p className="text-xs leading-relaxed" style={{color:"#92400E"}}>
              In <strong>{cfg.naam}</strong> doe je {cfg.btwAangifte.toLowerCase()} BTW-aangifte bij de{" "}
              <strong>{cfg.belastingdienst}</strong>. Het standaard BTW-tarief is {cfg.btwTarieven[0]}%.
            </p>
          </div>

          {BTW_KWARTALEN_BASE.map((q,i)=>{
            const btw = Math.round(q.omzet * btwTarief);
            const isIng = ingediend.includes(i);
            const st = isIng ? "betaald" : q.status;
            const stCfg = BTW_ST[st];
            return (
              <div key={q.kwartaal} className="bg-white rounded-2xl overflow-hidden"
                style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{borderBottom:"1px solid #F1F5F9"}}>
                  <div>
                    <p className="font-bold text-sm">{q.kwartaal}</p>
                    <p className="text-xs" style={{color:"#94A3B8"}}>{q.periode}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{background:stCfg.bg,color:stCfg.color}}>
                    {isIng?"✓ Betaald":stCfg.label}
                  </span>
                </div>
                {q.omzet>0 ? (
                  <div className="px-4 py-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{color:"#64748B"}}>Omzet (excl. BTW)</span>
                      <span className="font-semibold">€{fmt(q.omzet)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{color:"#64748B"}}>BTW ({cfg.btwTarieven[0]}%)</span>
                      <span className="font-semibold" style={{color:"#F59E0B"}}>€{fmt(btw)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="font-bold">Te betalen aan {cfg.belastingdienst}</span>
                      <span className="font-black" style={{color:"#EF4444"}}>€{fmt(btw)}</span>
                    </div>
                    {!isIng && st==="openstaand" && (
                      <button onClick={()=>setShowBtwModal(i)}
                        className="touch-scale mt-3 w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                        style={{background:"linear-gradient(135deg,#F59E0B,#EF4444)"}}>
                        <Send size={14}/> Aangifte indienen bij {cfg.belastingdienst}
                      </button>
                    )}
                    {(isIng||st==="betaald") && (
                      <div className="mt-3 py-2.5 rounded-xl flex items-center justify-center gap-2"
                        style={{background:"#F0FDF4"}}>
                        <Check size={14} style={{color:"#16A34A"}}/>
                        <span className="text-sm font-bold" style={{color:"#16A34A"}}>Aangifte gedaan ✓</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm" style={{color:"#94A3B8"}}>Kwartaal nog niet begonnen</p>
                  </div>
                )}
              </div>
            );
          })}
        </>)}

        {/* ══ BELASTING ══ */}
        {activeTab==="belasting" && (<>
          <div className="rounded-2xl p-4"
            style={{background:"linear-gradient(135deg,#4F46E5,#818CF8)",boxShadow:"0 4px 20px #4F46E540"}}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{cfg.vlag}</span>
              <p className="text-white/80 text-xs font-semibold">{cfg.inkomstenbelasting} 2026</p>
            </div>
            <p className="font-black text-3xl text-white">€{fmt(belasting)}</p>
            {cfg.socialeBijdragen && (
              <p className="text-white/70 text-xs mt-1">
                + {cfg.socialeBijdragen.naam}: €{fmt(sociaal)} → Totaal €{fmt(totaalBelastingDruk)}
              </p>
            )}
            <p className="text-white/60 text-xs mt-0.5">Reserveer €{fmt(reservePerMaand,0)}/maand</p>
          </div>

          {/* Aftrekposten */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sm">Aftrekposten — {cfg.naam}</p>
            </div>
            {[
              {label:"Bruto winst",       bedrag:netto,     color:"#10B981",plus:true},
              ...aftrekList.map(a=>({label:a.naam,bedrag:-a.bedrag,color:"#4F46E5",plus:false,info:a.info})),
              {label:"Belastbaar inkomen",bedrag:belastbaar,color:"#0F172A",plus:true,bold:true},
            ].map((r,i)=>(
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div>
                  <p className="text-sm" style={{fontWeight:("bold" in r&&r.bold)?700:500}}>{r.label}</p>
                  {"info" in r && r.info && <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>{r.info as string}</p>}
                </div>
                <p className="font-bold text-sm" style={{color:r.color}}>
                  {r.plus?"+":"−"}€{fmt(Math.abs(r.bedrag))}
                </p>
              </div>
            ))}
          </div>

          {/* Schijven */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sm">{cfg.inkomstenbelasting} — schijven 2026</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {cfg.schijven.map((s,i)=>{
                const prev = i>0?cfg.schijven[i-1].max:0;
                const deel = Math.max(0, Math.min(belastbaar, s.max===Infinity?belastbaar:s.max) - Math.min(belastbaar, prev));
                const tax  = Math.round(deel * s.tarief);
                if(deel===0 && prev>=belastbaar) return null;
                return (
                  <div key={i} className="rounded-xl p-3"
                    style={{background:s.kleur+"12",border:`1px solid ${s.kleur}25`}}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs font-bold" style={{color:s.kleur}}>{s.label}</span>
                      <span className="text-xs font-bold" style={{color:s.kleur}}>
                        {deel>0?`€${fmt(tax)}`:"—"}
                      </span>
                    </div>
                    <p className="text-xs" style={{color:s.kleur+"99"}}>
                      {s.max===Infinity
                        ? `Boven €${fmt(prev,0)}`
                        : `€${fmt(i>0?cfg.schijven[i-1].max:0,0)} – €${fmt(s.max,0)}`}
                      {deel>0 ? ` → €${fmt(deel,0)} × ${(s.tarief*100).toFixed(0)}%` : ""}
                    </p>
                  </div>
                );
              })}

              {/* Sociale bijdragen (BE/DE/FR) */}
              {cfg.socialeBijdragen && (
                <div className="rounded-xl p-3" style={{background:"#8B5CF615",border:"1px solid #8B5CF625"}}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-bold" style={{color:"#8B5CF6"}}>{cfg.socialeBijdragen.naam}</span>
                    <span className="text-xs font-bold" style={{color:"#8B5CF6"}}>€{fmt(sociaal)}</span>
                  </div>
                  <p className="text-xs" style={{color:"#8B5CF699"}}>{cfg.socialeBijdragen.info}</p>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-black text-sm">Totale belastingdruk</span>
                <span className="font-black text-sm" style={{color:"#EF4444"}}>€{fmt(totaalBelastingDruk)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{background:"#4F46E510",border:"1px solid #4F46E530"}}>
            <PiggyBank size={18} style={{color:"#4F46E5",flexShrink:0,marginTop:2}}/>
            <div>
              <p className="font-bold text-sm">Slim reserveren — {cfg.naam}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{color:"#64748B"}}>
                Reserveer maandelijks €{fmt(reservePerMaand,0)} zodat je de{" "}
                {cfg.inkomstenbelasting.toLowerCase()} altijd kan betalen.
                {cfg.socialeBijdragen && ` Inclusief ${cfg.socialeBijdragen.naam}.`}
              </p>
            </div>
          </div>
        </>)}

        {/* ══ KILOMETERS ══ */}
        {activeTab==="kilometers" && (<>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
              <Car size={16} style={{color:"#3B82F6"}} className="mb-2"/>
              <p className="font-black text-xl" style={{color:"#3B82F6"}}>{fmt(totKm,0)} km</p>
              <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>Zakelijk gereden</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
              <Euro size={16} style={{color:"#10B981"}} className="mb-2"/>
              <p className="font-black text-xl" style={{color:"#10B981"}}>€{fmt(kmVerg)}</p>
              <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>Belastingvrij</p>
            </div>
          </div>
          <div className="rounded-2xl p-3 flex items-start gap-2"
            style={{background:"#EFF6FF",border:"1px solid #DBEAFE"}}>
            <Car size={14} style={{color:"#3B82F6",flexShrink:0,marginTop:2}}/>
            <p className="text-xs leading-relaxed" style={{color:"#1E40AF"}}>
              <strong>{cfg.naam}:</strong> {cfg.kmLabel}
            </p>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sm">Rittenregistratie</p>
              <button onClick={()=>setShowAddR(true)}
                className="touch-scale flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{background:"#3B82F610",color:"#3B82F6"}}>
                <Plus size={12}/> Rit toevoegen
              </button>
            </div>
            {ritten.map((r,i)=>(
              <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i<ritten.length-1?"border-b border-gray-50":""}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:"#EFF6FF"}}>
                  <Car size={15} style={{color:"#3B82F6"}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.bestemming}</p>
                  <p className="text-xs mt-0.5" style={{color:"#94A3B8"}}>
                    {new Date(r.datum).toLocaleDateString("nl-NL",{day:"numeric",month:"short"})}
                    {r.doel ? ` · ${r.doel}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{color:"#3B82F6"}}>{fmt(r.km,1)} km</p>
                  <p className="text-[10px]" style={{color:"#94A3B8"}}>€{fmt(r.km*cfg.kmVergoeding)}</p>
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* ── Uitgave sheet ── */}
      {showAddU && (
        <div className="fixed inset-0 z-50 flex items-end" style={{background:"rgba(0,0,0,0.45)"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowAddU(false);}}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden"
            style={{background:"white",maxHeight:"88dvh"}}>
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"#EF444415"}}>
                <TrendingDown size={17} style={{color:"#EF4444"}}/>
              </div>
              <p className="font-black text-base flex-1">Uitgave toevoegen</p>
              <button onClick={()=>setShowAddU(false)}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center" style={{background:"#F1F5F9"}}>
                <X size={14} style={{color:"#64748B"}}/>
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:"#94A3B8"}}>Omschrijving *</label>
                <input value={nuOms} onChange={e=>setNuOms(e.target.value)} placeholder="Bijv. Verfroller kopen"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{borderColor:nuOms?"#4F46E5":"#E2E8F0",background:"#F8FAFC"}}/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:"#94A3B8"}}>Bedrag (€) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{color:"#64748B"}}>€</span>
                  <input type="number" value={nuBed} onChange={e=>setNuBed(e.target.value)} placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border outline-none text-sm"
                    style={{borderColor:nuBed?"#4F46E5":"#E2E8F0",background:"#F8FAFC"}}/>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:"#94A3B8"}}>Categorie</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(KAT_COLORS) as UitgaveKat[]).map(k=>(
                    <button key={k} onClick={()=>setNuKat(k)}
                      className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                      style={{background:nuKat===k?KAT_COLORS[k]:KAT_COLORS[k]+"12",color:nuKat===k?"white":KAT_COLORS[k]}}>
                      {KAT_ICONS[k]}{k}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:"#94A3B8"}}>Datum</label>
                <input type="date" value={nuDat} onChange={e=>setNuDat(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{borderColor:"#E2E8F0",background:"#F8FAFC"}}/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:"#94A3B8"}}>Bon (optioneel)</label>
                {nuBon?(
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={nuBon} alt="bon" className="w-full h-32 object-cover"/>
                    <button onClick={()=>setNuBon("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{background:"rgba(0,0,0,0.5)"}}>
                      <X size={13} color="white"/>
                    </button>
                  </div>
                ):(
                  <button onClick={()=>bonRef.current?.click()}
                    className="touch-scale w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold"
                    style={{borderColor:"#E2E8F0",color:"#94A3B8"}}>
                    <Camera size={16}/> Foto van bon
                  </button>
                )}
                <input ref={bonRef} type="file" accept="image/*" className="hidden"
                  onChange={e=>{
                    const f=e.target.files?.[0]; if(!f) return;
                    const r=new FileReader();
                    r.onload=ev=>setNuBon(ev.target?.result as string);
                    r.readAsDataURL(f);
                  }}/>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={saveUitgave} disabled={!nuOms.trim()||!nuBed}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm"
                style={{background:nuOms&&nuBed?"#EF4444":"#CBD5E1"}}>
                Uitgave opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rit sheet ── */}
      {showAddR && (
        <div className="fixed inset-0 z-50 flex items-end" style={{background:"rgba(0,0,0,0.45)"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowAddR(false);}}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden"
            style={{background:"white",maxHeight:"80dvh"}}>
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"#EFF6FF"}}>
                <Car size={17} style={{color:"#3B82F6"}}/>
              </div>
              <p className="font-black text-base flex-1">Rit registreren</p>
              <button onClick={()=>setShowAddR(false)}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center" style={{background:"#F1F5F9"}}>
                <X size={14} style={{color:"#64748B"}}/>
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              {[
                {label:"Bestemming *",val:rBest,set:setRBest,ph:"Bijv. Jordaan, Amsterdam",type:"text"},
                {label:"Kilometers *",val:rKm,set:setRKm,ph:"0.0",type:"number"},
                {label:"Doel",val:rDoel,set:setRDoel,ph:"Bijv. Klus: kraan",type:"text"},
              ].map(f=>(
                <div key={f.label}>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:"#94A3B8"}}>{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                    style={{borderColor:f.val?"#3B82F6":"#E2E8F0",background:"#F8FAFC"}}/>
                  {f.label.includes("Kilom") && rKm && (
                    <p className="text-xs mt-1 font-semibold" style={{color:"#10B981"}}>
                      = €{fmt(parseFloat(rKm||"0")*cfg.kmVergoeding)} belastingvrij
                    </p>
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:"#94A3B8"}}>Datum</label>
                <input type="date" value={rDat} onChange={e=>setRDat(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{borderColor:"#E2E8F0",background:"#F8FAFC"}}/>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={saveRit} disabled={!rBest.trim()||!rKm}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm"
                style={{background:rBest&&rKm?"#3B82F6":"#CBD5E1"}}>
                Rit opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BTW bevestiging ── */}
      {showBtwModal!==null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{background:"rgba(0,0,0,0.5)"}}
          onClick={()=>setShowBtwModal(null)}>
          <div className="w-full max-w-[360px] rounded-3xl overflow-hidden"
            style={{background:"white",boxShadow:"0 24px 64px rgba(0,0,0,0.25)"}}
            onClick={e=>e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{background:"linear-gradient(135deg,#F59E0B20,#EF444420)"}}>
                <Send size={28} style={{color:"#F59E0B"}}/>
              </div>
              <p className="text-lg">{cfg.vlag}</p>
              <h2 className="font-black text-xl mb-2">BTW Aangifte</h2>
              <p className="text-sm leading-relaxed" style={{color:"#64748B"}}>
                Aangifte voor <strong>{BTW_KWARTALEN_BASE[showBtwModal].kwartaal}</strong> bij{" "}
                <strong>{cfg.belastingdienst}</strong>.
              </p>
              <div className="mt-4 p-4 rounded-2xl text-left" style={{background:"#FEF3C7"}}>
                <div className="flex justify-between text-sm">
                  <span style={{color:"#92400E"}}>Te betalen</span>
                  <span className="font-black" style={{color:"#D97706"}}>
                    €{fmt(Math.round(BTW_KWARTALEN_BASE[showBtwModal].omzet * btwTarief))}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button onClick={()=>{setIngediend(p=>[...p,showBtwModal!]);setShowBtwModal(null);}}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm"
                style={{background:"linear-gradient(135deg,#F59E0B,#EF4444)"}}>
                ✓ Aangifte bevestigen
              </button>
              <button onClick={()=>setShowBtwModal(null)}
                className="touch-scale w-full py-3 rounded-2xl font-semibold text-sm"
                style={{color:"#64748B"}}>
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
