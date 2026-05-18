// ─── Types ────────────────────────────────────────────────────────────────────

export type LandCode = "BE" | "NL" | "DE" | "FR" | "LU" | "GB" | "anders";

export type Bedrijf = {
  land: LandCode;
  naam: string;
  handelsnaam: string;
  /** KvK (NL), Ondernemingsnummer (BE), SIRET (FR), Steuernummer (DE), … */
  registratieNummer: string;
  btw: string;
  iban: string;
  bankNaam: string;
  email: string;
  telefoon: string;
  website: string;
  adres: string;
  postcode: string;
  stad: string;
  logo?: string;
  betalingstermijn: number; // dagen
  btw_percentage: number;
  offertePrefix: string;
  factuurPrefix: string;
  offerteVolgNr: number;
  factuurVolgNr: number;
  footer: string;
  /** legacy — blijft voor backwards compat */
  kvk?: string;
};

// ─── Land configuratie ────────────────────────────────────────────────────────

export type LandConfig = {
  naam: string;
  vlag: string;
  registratie: {
    label: string;
    placeholder: string;
    hint: string;
  };
  btw: {
    label: string;
    placeholder: string;
    hint: string;
  } | null;            // null = BTW-veld niet tonen
  btwPercentages: number[];
};

export const LANDEN: Record<LandCode, LandConfig> = {
  BE: {
    naam: "België",
    vlag: "🇧🇪",
    registratie: {
      label: "Ondernemingsnummer",
      placeholder: "0xxx.xxx.xxx",
      hint: "9-cijferig nummer — te vinden via company.info of de KBO",
    },
    btw: {
      label: "BTW-nummer",
      placeholder: "BE0123.456.789",
      hint: "Verplicht bij omzet > €25.000/jaar (kleine onderneming: optioneel)",
    },
    btwPercentages: [0, 6, 12, 21],
  },
  NL: {
    naam: "Nederland",
    vlag: "🇳🇱",
    registratie: {
      label: "KvK-nummer",
      placeholder: "12345678",
      hint: "8 cijfers — te vinden op kvk.nl",
    },
    btw: {
      label: "BTW-nummer",
      placeholder: "NL123456789B01",
      hint: "Verplicht als je BTW-aangifte doet",
    },
    btwPercentages: [0, 9, 21],
  },
  DE: {
    naam: "Duitsland",
    vlag: "🇩🇪",
    registratie: {
      label: "Steuernummer",
      placeholder: "12/345/67890",
      hint: "Belastingnummer — afgegeven door het Finanzamt",
    },
    btw: {
      label: "USt-IdNr. (btw)",
      placeholder: "DE123456789",
      hint: "Verplicht voor EU-grensoverschrijdende leveringen",
    },
    btwPercentages: [0, 7, 19],
  },
  FR: {
    naam: "Frankrijk",
    vlag: "🇫🇷",
    registratie: {
      label: "Numéro SIRET",
      placeholder: "123 456 789 00012",
      hint: "14 cijfers — te vinden op sirene.fr",
    },
    btw: {
      label: "Numéro TVA",
      placeholder: "FR12345678901",
      hint: "Vereist bij btw-plichtige inschrijving",
    },
    btwPercentages: [0, 5.5, 10, 20],
  },
  LU: {
    naam: "Luxemburg",
    vlag: "🇱🇺",
    registratie: {
      label: "Numéro RCS",
      placeholder: "B 123456",
      hint: "Registratienummer Registre de Commerce et des Sociétés",
    },
    btw: {
      label: "Numéro TVA",
      placeholder: "LU12345678",
      hint: "Verplicht bij omzet > €35.000/jaar",
    },
    btwPercentages: [0, 8, 17],
  },
  GB: {
    naam: "Verenigd Koninkrijk",
    vlag: "🇬🇧",
    registratie: {
      label: "Company number",
      placeholder: "12345678",
      hint: "8 characters — Companies House (companieshouse.gov.uk)",
    },
    btw: {
      label: "VAT number",
      placeholder: "GB123456789",
      hint: "Required if turnover exceeds £90,000/year",
    },
    btwPercentages: [0, 5, 20],
  },
  anders: {
    naam: "Ander land",
    vlag: "🌍",
    registratie: {
      label: "Registratienummer",
      placeholder: "Bedrijfsregistratienummer",
      hint: "Officieel registratienummer in jouw land",
    },
    btw: {
      label: "BTW / VAT-nummer",
      placeholder: "Landcode + nummer",
      hint: "Indien van toepassing",
    },
    btwPercentages: [0, 10, 20, 25],
  },
};

export type Dienst = {
  id: string;
  naam: string;
  beschrijving: string;
  prijs: number;
  eenheid: "per uur" | "per dag" | "vast bedrag" | "per m²" | "per stuk";
  duurMinuten: number;   // geschatte duur
  bufferMinuten: number; // reistijd/opruimtijd erna
  categorie: string;
  actief: boolean;
  btw: boolean;
};

export type OfferteRegel = {
  id: string;
  omschrijving: string;
  aantal: number;
  eenheid: string;
  prijsPerEenheid: number;
  btwPercentage: number;
};

export type Offerte = {
  id: string;
  nummer: string;
  klantNaam: string;
  klantAdres: string;
  klantEmail: string;
  klantTelefoon: string;
  datum: string;
  geldigTot: string;
  regels: OfferteRegel[];
  notities: string;
  status: "concept" | "verstuurd" | "geaccepteerd" | "verlopen" | "geweigerd";
  opdrachtId?: string;
};

export type Factuur = Offerte & {
  factuurNummer: string;
  vervaldatum: string;
  betaaldOp?: string;
  factuurStatus: "open" | "herinnering" | "betaald" | "verlopen";
};

export type AgendaSlot = {
  id: string;
  datum: string;       // YYYY-MM-DD
  start: string;       // "09:00"
  eind: string;        // "10:30"
  dienstId?: string;
  klant?: string;
  klantAvatar?: string;
  status: "beschikbaar" | "gereserveerd" | "bezet" | "buffer";
  opdrachtNaam?: string;
  reistijdNa?: number; // minuten
  overschreden?: boolean;
};

// ─── Mock bedrijfsgegevens ────────────────────────────────────────────────────

export const MOCK_BEDRIJF: Bedrijf = {
  land: "NL",
  naam: "Marco van den Berg Loodgietersbedrijf",
  handelsnaam: "Marco Loodgieter",
  registratieNummer: "12345678",
  btw: "NL123456789B01",
  iban: "NL91 ABNA 0417 1643 00",
  bankNaam: "ABN AMRO",
  email: "marco@marcoloodgieter.nl",
  telefoon: "06-12345678",
  website: "www.marcoloodgieter.nl",
  adres: "Haarlemmerdijk 45",
  postcode: "1013 KA",
  stad: "Amsterdam",
  betalingstermijn: 14,
  btw_percentage: 21,
  offertePrefix: "OFF-",
  factuurPrefix: "FAC-",
  offerteVolgNr: 1042,
  factuurVolgNr: 876,
  footer: "Betaling graag binnen de betalingstermijn. Bij vragen neem contact op via email of telefoon.",
};

// ─── Mock diensten ────────────────────────────────────────────────────────────

export const MOCK_DIENSTEN: Dienst[] = [
  {
    id: "d1",
    naam: "Lekkage reparatie",
    beschrijving: "Opsporen en repareren van lekkages bij kranen, leidingen en aansluitingen.",
    prijs: 85,
    eenheid: "per uur",
    duurMinuten: 60,
    bufferMinuten: 20,
    categorie: "Loodgieter",
    actief: true,
    btw: true,
  },
  {
    id: "d2",
    naam: "Toilet installatie",
    beschrijving: "Volledig plaatsen en aansluiten van een nieuw toilet (materiaal niet inbegrepen).",
    prijs: 195,
    eenheid: "vast bedrag",
    duurMinuten: 120,
    bufferMinuten: 30,
    categorie: "Loodgieter",
    actief: true,
    btw: true,
  },
  {
    id: "d3",
    naam: "CV ketel inspectie",
    beschrijving: "Jaarlijkse inspectie en onderhoud van de CV ketel. Inclusief kleine reparaties.",
    prijs: 99,
    eenheid: "vast bedrag",
    duurMinuten: 90,
    bufferMinuten: 15,
    categorie: "HVAC",
    actief: true,
    btw: true,
  },
  {
    id: "d4",
    naam: "Kraan vervangen",
    beschrijving: "Vervangen van een bestaande kraan (materiaalkosten apart)",
    prijs: 65,
    eenheid: "vast bedrag",
    duurMinuten: 45,
    bufferMinuten: 15,
    categorie: "Loodgieter",
    actief: true,
    btw: true,
  },
  {
    id: "d5",
    naam: "Badkamer renovatie",
    beschrijving: "Volledige renovatie van badkamer inclusief loodgieterswerkzaamheden.",
    prijs: 75,
    eenheid: "per uur",
    duurMinuten: 480,
    bufferMinuten: 60,
    categorie: "Loodgieter",
    actief: true,
    btw: true,
  },
];

// ─── Mock offertes ────────────────────────────────────────────────────────────

export const MOCK_OFFERTES_PRO: Offerte[] = [
  {
    id: "off-pro-1",
    nummer: "OFF-1042",
    klantNaam: "Lisa de Vries",
    klantAdres: "Prinsengracht 88, 1015 PR Amsterdam",
    klantEmail: "lisa@email.nl",
    klantTelefoon: "06-98765432",
    datum: "2026-05-18",
    geldigTot: "2026-06-01",
    regels: [
      { id: "r1", omschrijving: "Lekkage reparatie — kraan keuken", aantal: 1, eenheid: "uur", prijsPerEenheid: 85, btwPercentage: 21 },
      { id: "r2", omschrijving: "Afdichtingsmateriaal", aantal: 1, eenheid: "stuk", prijsPerEenheid: 12, btwPercentage: 21 },
      { id: "r3", omschrijving: "Voorrijkosten", aantal: 1, eenheid: "vast", prijsPerEenheid: 25, btwPercentage: 21 },
    ],
    notities: "Werkzaamheden worden uitgevoerd vandaag om 15:00. Parkeerkosten zijn voor rekening van de klant.",
    status: "verstuurd",
    opdrachtId: "o1",
  },
];

// ─── Agenda helpers ───────────────────────────────────────────────────────────

/**
 * Bereken eindtijd op basis van starttijd + minuten
 */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/**
 * Controleer of twee tijdsloten overlappen
 */
export function slotsOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Genereer beschikbare boekingstijden voor een dag,
 * rekening houdend met duur van dienst + reisbuffer + bestaande boekingen.
 */
export function genereerBeschikbareSlots(
  datum: string,
  dienst: Dienst,
  bestaandeSlots: AgendaSlot[],
  werkStart = "08:00",
  werkEind = "17:00"
): { start: string; eind: string; beschikbaar: boolean }[] {
  const stap = 30; // minuten tussen opties
  const resultaat: { start: string; eind: string; beschikbaar: boolean }[] = [];

  let current = werkStart;
  while (true) {
    const eind = addMinutes(current, dienst.duurMinuten);
    const eindMetBuffer = addMinutes(eind, dienst.bufferMinuten);

    // Stop als we voorbij werktijd gaan
    if (eindMetBuffer > werkEind) break;

    // Check overlap met bestaande boekingen
    const daagSlots = bestaandeSlots.filter(s => s.datum === datum && s.status !== "beschikbaar");
    const heeftConflict = daagSlots.some(s =>
      slotsOverlap(current, eindMetBuffer, s.start, s.eind)
    );

    resultaat.push({ start: current, eind, beschikbaar: !heeftConflict });
    current = addMinutes(current, stap);
  }

  return resultaat;
}

// ─── Mock agenda slots ────────────────────────────────────────────────────────

export const MOCK_AGENDA: AgendaSlot[] = [
  {
    id: "ag1",
    datum: "2026-05-19",
    start: "09:00",
    eind: "10:00",
    dienstId: "d1",
    klant: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    status: "gereserveerd",
    opdrachtNaam: "Lekkage reparatie",
    reistijdNa: 20,
    overschreden: false,
  },
  {
    id: "ag2",
    datum: "2026-05-19",
    start: "10:20",
    eind: "12:20",
    dienstId: "d2",
    klant: "Ahmed Mansour",
    klantAvatar: "https://i.pravatar.cc/150?img=33",
    status: "gereserveerd",
    opdrachtNaam: "Toilet installatie",
    reistijdNa: 30,
    overschreden: false,
  },
  {
    id: "ag3",
    datum: "2026-05-19",
    start: "12:50",
    eind: "14:20",
    dienstId: "d3",
    klant: "Petra Jansen",
    klantAvatar: "https://i.pravatar.cc/150?img=47",
    status: "gereserveerd",
    opdrachtNaam: "CV ketel inspectie",
    reistijdNa: 15,
    overschreden: true, // ⚠️ vorige taak liep uit
  },
  {
    id: "ag4",
    datum: "2026-05-20",
    start: "08:30",
    eind: "09:15",
    dienstId: "d4",
    status: "beschikbaar",
  },
  {
    id: "ag5",
    datum: "2026-05-20",
    start: "14:00",
    eind: "15:30",
    dienstId: "d3",
    klant: "Sandra Hoek",
    klantAvatar: "https://i.pravatar.cc/150?img=56",
    status: "gereserveerd",
    opdrachtNaam: "CV ketel inspectie",
    reistijdNa: 15,
    overschreden: false,
  },
];
