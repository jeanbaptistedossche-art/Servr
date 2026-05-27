import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "klant" | "vakman" | "beide" | null;
export type Land = "NL" | "BE" | "DE" | "FR";

export type UserState = {
  role: UserRole;
  /** Welke modus is momenteel actief (klant of vakman view) */
  activeView: "klant" | "vakman";
  name: string;
  address: string;
  lat: number;
  lng: number;
  isLoggedIn: boolean;
  isAdmin: boolean;
  unreadMeldingen: number;
  unreadBerichten: number;
  // extra profiel velden
  avatar: string;        // base64 data-URL of lege string
  phone: string;
  email: string;
  bio: string;           // vakman: over mij / klant: korte intro
  website: string;       // vakman only
  specialty: string;     // vakman: hoofdspecialiteit
  uurtarief: number;     // vakman: starttarief
  land: Land;            // land van de gebruiker
  // actions
  login: (opts: { role: UserRole; name: string; address?: string; isAdmin?: boolean }) => void;
  setRole: (r: UserRole) => void;
  setActiveView: (v: "klant" | "vakman") => void;
  setProfile: (p: Partial<Pick<UserState,
    "name" | "address" | "lat" | "lng" |
    "avatar" | "phone" | "email" | "bio" | "website" | "specialty" | "uurtarief" | "land"
  >>) => void;
  setLand: (l: Land) => void;
  markMeldingenRead: () => void;
  markBerichtenRead: () => void;
  logout: () => void;
};

function defaultView(role: UserRole): "klant" | "vakman" {
  if (role === "vakman" || role === "beide") return "vakman";
  return "klant";
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      role: null,
      activeView: "klant",
      name: "",
      address: "Amsterdam",
      lat: 52.3676,
      lng: 4.9041,
      isLoggedIn: false,
      isAdmin: false,
      unreadMeldingen: 2,
      unreadBerichten: 3,
      avatar: "",
      phone: "",
      email: "",
      bio: "",
      website: "",
      specialty: "",
      uurtarief: 0,
      land: "NL",

      login: ({ role, name, address, isAdmin }) =>
        set({
          isLoggedIn: true,
          role,
          activeView: defaultView(role),
          name: name || "Gebruiker",
          address: address || "Amsterdam",
          isAdmin: isAdmin ?? false,
        }),

      setRole: (role) => set((s) => ({
        role,
        // Alleen syncen als het geen "beide" is (dan mag activeView onafhankelijk zijn)
        activeView: role === "beide" ? s.activeView : defaultView(role),
      })),

      setActiveView: (activeView) => set({ activeView }),

      setProfile: (p) => set(p),

      setLand: (land) => set({ land }),

      markMeldingenRead: () => set({ unreadMeldingen: 0 }),

      markBerichtenRead: () => set({ unreadBerichten: 0 }),

      logout: () =>
        set({ role: null, activeView: "klant", isLoggedIn: false, isAdmin: false, name: "", address: "" }),
    }),
    { name: "servr-user-v2" }  // v2 om stale localStorage te resetten
  )
);

// ─── shared types & mock data (unchanged) ─────────────────────────────────────

export type Opdracht = {
  id: string;
  klant: string;
  klantAvatar: string;
  title: string;
  beschrijving: string;
  categorie: string;
  categorieIcon: string;
  adres: string;
  lat: number;
  lng: number;
  afstand: string;
  foto?: string;
  budget: string;
  status: "open" | "offerte_ontvangen" | "geaccepteerd" | "betaald" | "afgerond";
  urgentie: "laag" | "middel" | "hoog";
  aangemaakt: string;
};

export type Offerte = {
  id: string;
  opdrachtId: string;
  vakman: string;
  vakmanAvatar: string;
  vakmanScore: number;
  prijs: number;
  beschrijving: string;
  eta: string;
  geldigTot: string;
  status: "wachtend" | "geaccepteerd" | "betaald" | "geweigerd";
};

export const MOCK_OPDRACHTEN: Opdracht[] = [
  {
    id: "o1",
    klant: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    title: "Lekkende kraan keuken",
    beschrijving: "De kraan in de keuken lekt bij de aansluiting onder het aanrecht. Al 2 dagen last van. Graag snel opgelost.",
    categorie: "Loodgieter",
    categorieIcon: "🔧",
    adres: "Jordaan, Prinsengracht 88, Amsterdam",
    lat: 52.3738,
    lng: 4.8847,
    afstand: "0.4 km",
    foto: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400",
    budget: "€60-90",
    status: "open",
    urgentie: "hoog",
    aangemaakt: "5 min geleden",
  },
  {
    id: "o2",
    klant: "Ahmed Mansour",
    klantAvatar: "https://i.pravatar.cc/150?img=33",
    title: "CV ketel inspectie",
    beschrijving: "Jaarlijkse inspectie van de cv ketel. Liefst komende week.",
    categorie: "HVAC",
    categorieIcon: "❄️",
    adres: "De Pijp, Ferdinand Bolstraat 45, Amsterdam",
    lat: 52.3546,
    lng: 4.8975,
    afstand: "1.8 km",
    budget: "€75",
    status: "offerte_ontvangen",
    urgentie: "laag",
    aangemaakt: "2 uur geleden",
  },
  {
    id: "o3",
    klant: "Petra Jansen",
    klantAvatar: "https://i.pravatar.cc/150?img=47",
    title: "Woonkamer schilderen",
    beschrijving: "Woonkamer + hal schilderen in warm wit. Ca. 45m². Inclusief plafond.",
    categorie: "Schilder",
    categorieIcon: "🖌️",
    adres: "Oud-West, Kinkerstraat 120, Amsterdam",
    lat: 52.3661,
    lng: 4.8742,
    afstand: "2.1 km",
    foto: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400",
    budget: "€400-600",
    status: "geaccepteerd",
    urgentie: "middel",
    aangemaakt: "Gisteren",
  },
  {
    id: "o4",
    klant: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    title: "Toilet installatie",
    beschrijving: "Nieuw toilet geplaatst in badkamer op eerste verdieping.",
    categorie: "Loodgieter",
    categorieIcon: "🔧",
    adres: "Jordaan, Prinsengracht 88, Amsterdam",
    lat: 52.3738,
    lng: 4.8847,
    afstand: "0.4 km",
    budget: "€195",
    status: "betaald",
    urgentie: "laag",
    aangemaakt: "18 mei 2026",
  },
  {
    id: "o5",
    klant: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    title: "Lekkage reparatie keuken",
    beschrijving: "Kraan keuken lekte bij aansluiting — opgelost.",
    categorie: "Loodgieter",
    categorieIcon: "🔧",
    adres: "Jordaan, Prinsengracht 88, Amsterdam",
    lat: 52.3738,
    lng: 4.8847,
    afstand: "0.4 km",
    budget: "€75",
    status: "afgerond",
    urgentie: "hoog",
    aangemaakt: "10 mei 2026",
  },
];

export const MOCK_OFFERTES: Offerte[] = [
  {
    id: "off1",
    opdrachtId: "o1",
    vakman: "Marco van den Berg",
    vakmanAvatar: "https://i.pravatar.cc/150?img=11",
    vakmanScore: 94,
    prijs: 75,
    beschrijving: "Ik kom dit vandaag nog oplossen. Inclusief materiaal en 3 maanden garantie.",
    eta: "Vandaag, 15:00",
    geldigTot: "Vandaag 20:00",
    status: "wachtend",
  },
  {
    id: "off2",
    opdrachtId: "o1",
    vakman: "Yusuf Aydın",
    vakmanAvatar: "https://i.pravatar.cc/150?img=33",
    vakmanScore: 91,
    prijs: 85,
    beschrijving: "Kan morgenochtend komen. Prijs inclusief nieuw afdichtingsmateriaal.",
    eta: "Morgen, 09:00",
    geldigTot: "Morgen 18:00",
    status: "wachtend",
  },
];
