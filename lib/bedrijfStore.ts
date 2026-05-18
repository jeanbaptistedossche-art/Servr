// ─── Types ────────────────────────────────────────────────────────────────────

export type Bedrijf = {
  naam: string;
  handelsnaam: string;
  kvk: string;
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
  naam: "Marco van den Berg Loodgietersbedrijf",
  handelsnaam: "Marco Loodgieter",
  kvk: "12345678",
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
