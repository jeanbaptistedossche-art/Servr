export type Provider = {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  category: string;
  categoryIcon: string;
  distance: string;
  rating: number;
  reviewCount: number;
  priceMin: number;
  priceMax: number;
  available: boolean;
  servrScore: number;
  badges: string[];
  bio: string;
  photos: string[];
  services: { name: string; price: number; duration: string }[];
  reviews: { author: string; rating: number; text: string; date: string }[];
  lat: number;
  lng: number;
  address: string;
};

export const CATEGORIES = [
  { id: "loodgieter",   label: "Loodgieter",        icon: "🔧", color: "#2563eb" },
  { id: "elektricien",  label: "Elektricien",        icon: "⚡", color: "#d97706" },
  { id: "schilder",     label: "Schilder",            icon: "🖌️", color: "#7c3aed" },
  { id: "timmerman",    label: "Timmerman",           icon: "🪚", color: "#b45309" },
  { id: "schoonmaak",   label: "Schoonmaak",          icon: "🧹", color: "#0891b2" },
  { id: "tuinman",      label: "Tuinman",             icon: "🌿", color: "#16a34a" },
  { id: "verhuizen",    label: "Verhuizen",           icon: "📦", color: "#dc2626" },
  { id: "sloten",       label: "Slotenmaker",         icon: "🔑", color: "#4f46e5" },
  { id: "hvac",         label: "HVAC / Ketel",        icon: "❄️", color: "#0284c7" },
  { id: "dak",          label: "Dakdekker",           icon: "🏠", color: "#92400e" },
  { id: "zwembad",      label: "Zwembad",             icon: "🏊", color: "#0ea5e9" },
  { id: "glas",         label: "Glazenwasser",        icon: "🪟", color: "#64748b" },
  { id: "tuin-aanleg",  label: "Tuin aanleg",         icon: "🌱", color: "#15803d" },
  { id: "it",           label: "IT & Computer",       icon: "💻", color: "#6366f1" },
  { id: "bestrating",   label: "Bestrating",          icon: "🧱", color: "#a16207" },
  { id: "klusser",      label: "Klusser",             icon: "🔨", color: "#f59e0b" },
  { id: "zonnepanelen", label: "Zonnepanelen",        icon: "☀️", color: "#eab308" },
  { id: "gevel",        label: "Gevel & Buiten",      icon: "🏗️", color: "#78716c" },
  { id: "verwarming",   label: "Verwarming",          icon: "🔥", color: "#f97316" },
  { id: "garage",       label: "Garagedeur",          icon: "🚗", color: "#6b7280" },
  { id: "isolatie",     label: "Isolatie",            icon: "🧊", color: "#0e7490" },
  { id: "riolering",    label: "Riolering",           icon: "🕳️", color: "#57534e" },
  { id: "intercom",     label: "Intercom / Alarm",    icon: "🔔", color: "#8b5cf6" },
  { id: "tegels",       label: "Tegelwerk",           icon: "🔲", color: "#0f766e" },
  { id: "parket",       label: "Parket / Vloer",      icon: "🪵", color: "#92400e" },
  { id: "airco",        label: "Airco",               icon: "🌬️", color: "#38bdf8" },
  { id: "pergola",      label: "Pergola / Terras",    icon: "⛱️", color: "#65a30d" },
  { id: "oprit",        label: "Oprit / Betonwerk",   icon: "🏛️", color: "#a8a29e" },
  { id: "rolluiken",    label: "Rolluiken",           icon: "🪞", color: "#6b7280" },
  { id: "andere",       label: "Andere",              icon: "🛠️", color: "#6b7280" },
];

export const PROVIDERS: Provider[] = [
  {
    id: "p1",
    name: "Marco van den Berg",
    avatar: "https://i.pravatar.cc/150?img=11",
    phone: "+32470123456",
    category: "Loodgieter",
    categoryIcon: "🔧",
    distance: "0.4 km",
    lat: 52.3744, lng: 4.8813,
    address: "Westerstraat 45, Jordaan, Amsterdam",
    rating: 4.9,
    reviewCount: 127,
    priceMin: 65,
    priceMax: 120,
    available: true,
    servrScore: 94,
    badges: ["Topvakman", "Snel reageren", "Schoon werken"],
    bio: "15 jaar ervaring als loodgieter in Amsterdam. Gespecialiseerd in lekkages, badkamerrenovaties en cv-installaties.",
    photos: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400",
    ],
    services: [
      { name: "Lekkage reparatie", price: 85, duration: "1-2 uur" },
      { name: "Kraan vervangen", price: 65, duration: "30 min" },
      { name: "Toilet installatie", price: 120, duration: "2-3 uur" },
      { name: "CV inspectie", price: 75, duration: "1 uur" },
    ],
    reviews: [
      { author: "Lisa de Vries", rating: 5, text: "Super snel en netjes gewerkt. Lekkage binnen het uur opgelost!", date: "2 dagen geleden" },
      { author: "Ahmed Mansour", rating: 5, text: "Professioneel en eerlijke prijs. Zeker aanbevelen!", date: "1 week geleden" },
      { author: "Petra Jansen", rating: 4, text: "Goed werk, wel wat later dan gepland.", date: "2 weken geleden" },
    ],
  },
  {
    id: "p2",
    name: "Sofia Martins",
    avatar: "https://i.pravatar.cc/150?img=47",
    phone: "+32470234567",
    category: "Schoonmaak",
    categoryIcon: "🧹",
    distance: "0.8 km",
    lat: 52.3736, lng: 4.8954,
    address: "Utrechtsestraat 12, Centrum, Amsterdam",
    rating: 4.8,
    reviewCount: 89,
    priceMin: 25,
    priceMax: 45,
    available: true,
    servrScore: 88,
    badges: ["Eco-vriendelijk", "Stipt op tijd"],
    bio: "Professionele schoonmaakster met oog voor detail. Gebruik uitsluitend milieuvriendelijke producten.",
    photos: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
      "https://images.unsplash.com/photo-1527515637462-cff94edd56f9?w=400",
    ],
    services: [
      { name: "Reguliere schoonmaak", price: 35, duration: "2-3 uur" },
      { name: "Dieptereiniging", price: 45, duration: "4-5 uur" },
      { name: "Na oplevering", price: 65, duration: "6+ uur" },
    ],
    reviews: [
      { author: "Tom Bakker", rating: 5, text: "Mijn huis glom nog nooit zo! Absoluut top.", date: "3 dagen geleden" },
      { author: "Roos Smit", rating: 5, text: "Betrouwbaar en grondig. Iedere week weer.", date: "1 week geleden" },
    ],
  },
  {
    id: "p3",
    name: "Yusuf Aydın",
    avatar: "https://i.pravatar.cc/150?img=33",
    phone: "+32470345678",
    category: "Elektricien",
    categoryIcon: "⚡",
    distance: "1.2 km",
    lat: 52.3530, lng: 4.8955,
    address: "Albert Cuypstraat 88, De Pijp, Amsterdam",
    rating: 4.7,
    reviewCount: 203,
    priceMin: 70,
    priceMax: 150,
    available: false,
    servrScore: 91,
    badges: ["Gecertificeerd", "Spoedklaar"],
    bio: "Gecertificeerd elektricien. Storingen, groepenkast upgrades, laadpalen voor EV's.",
    photos: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400",
    ],
    services: [
      { name: "Storing oplossen", price: 85, duration: "1-2 uur" },
      { name: "Groepenkast upgrade", price: 350, duration: "Halve dag" },
      { name: "Laadpaal installatie", price: 450, duration: "Halve dag" },
    ],
    reviews: [
      { author: "Jan de Wit", rating: 5, text: "Storing 's avonds opgelost. Echte noodservice!", date: "5 dagen geleden" },
      { author: "Marie Dubois", rating: 4, text: "Vakkundig werk aan onze groepenkast.", date: "2 weken geleden" },
    ],
  },
  {
    id: "p4",
    name: "Kim Nguyen",
    avatar: "https://i.pravatar.cc/150?img=56",
    phone: "+32470456789",
    category: "Schilder",
    categoryIcon: "🖌️",
    distance: "1.5 km",
    lat: 52.3653, lng: 4.8726,
    address: "Bilderdijkstraat 34, Oud-West, Amsterdam",
    rating: 4.9,
    reviewCount: 64,
    priceMin: 30,
    priceMax: 55,
    available: true,
    servrScore: 85,
    badges: ["Kleuradviseur", "Strak afwerken"],
    bio: "Interieurschilder met passie voor perfecte afwerking. Ook behangen en lak spuiten.",
    photos: [
      "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400",
    ],
    services: [
      { name: "Kamer schilderen", price: 350, duration: "1 dag" },
      { name: "Volledig huis", price: 1800, duration: "1 week" },
      { name: "Behangen", price: 45, duration: "Per rol" },
    ],
    reviews: [
      { author: "Sandra Hoek", rating: 5, text: "Prachtig resultaat! Strak en netjes.", date: "1 week geleden" },
    ],
  },
];

export const HOT_JOBS = [
  { id: "j1", user: "Anita K.", location: "Jordaan", category: "loodgieter", categoryLabel: "Loodgieter", description: "Lekkende kraan keuken — SPOED", time: "2 min geleden", bids: 3, budget: "€60-90" },
  { id: "j2", user: "Daan R.", location: "De Pijp", category: "elektricien", categoryLabel: "Elektricien", description: "Geen stroom in slaapkamer", time: "5 min geleden", bids: 1, budget: "€80-120" },
  { id: "j3", user: "Lena B.", location: "Oud-West", category: "schoonmaak", categoryLabel: "Schoonmaak", description: "Dieptereiniging na verhuizing", time: "8 min geleden", bids: 5, budget: "€120-180" },
  { id: "j4", user: "Omar F.", location: "Bos en Lommer", category: "schilder", categoryLabel: "Schilder", description: "Woonkamer + hal schilderen", time: "12 min geleden", bids: 2, budget: "€400-600" },
  { id: "j5", user: "Eva S.", location: "Centrum", category: "sloten", categoryLabel: "Slotenmaker", description: "Sleutel afgebroken in slot", time: "15 min geleden", bids: 4, budget: "€50-80" },
];

export const BEFORE_AFTER = [
  {
    id: "ba1",
    provider: "Marco van den Berg",
    avatar: "https://i.pravatar.cc/150?img=11",
    category: "Loodgieter",
    before: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400",
    after: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    description: "Volledige badkamerrenovatie — van oud naar nieuw in 3 dagen 🚿",
    likes: 47,
    location: "Jordaan, Amsterdam",
  },
  {
    id: "ba2",
    provider: "Kim Nguyen",
    avatar: "https://i.pravatar.cc/150?img=56",
    category: "Schilder",
    before: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
    after: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400",
    description: "Woonkamer transformatie — van grijs naar warm wit 🎨",
    likes: 83,
    location: "De Pijp, Amsterdam",
  },
];

export const TICKER_ITEMS = [
  "Marco lost lekkage op in Jordaan",
  "Yusuf installeert laadpaal in Zuid",
  "Sofia klaart oplevering in Noord",
  "Kim schildert 3-kamer app in Oost",
  "Slotenmaker geroepen in Centrum",
  "Verhuisbedrijf actief in West",
  "Tuinman bezig in Watergraafsmeer",
];
