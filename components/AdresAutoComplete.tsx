"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

type Suggestie = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

function formatKort(s: Suggestie): string {
  const a = s.address;
  const straat = [a.road, a.house_number].filter(Boolean).join(" ");
  const stad = a.city ?? a.town ?? a.village ?? a.municipality ?? "";
  if (straat && stad) return `${straat}, ${stad}`;
  if (stad) return stad;
  return s.display_name.split(",").slice(0, 2).join(",").trim();
}

function formatSub(s: Suggestie): string {
  const a = s.address;
  const parts = [
    a.postcode,
    a.city ?? a.town ?? a.village ?? a.municipality,
    a.state,
    a.country,
  ].filter(Boolean);
  return parts.slice(0, 3).join(", ");
}

type Props = {
  value: string;
  onChange: (adres: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  label?: string;
  accent?: string;
};

export default function AdresAutoComplete({
  value,
  onChange,
  placeholder = "Straat en huisnummer...",
  label,
  accent = "var(--teal)",
}: Props) {
  const [query, setQuery]         = useState(value);
  const [suggesties, setSuggesties] = useState<Suggestie[]>([]);
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Sync value → query wanneer parent het resetten
  useEffect(() => {
    if (value !== query && !open) setQuery(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced Nominatim zoeken
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query || query.length < 3) {
      setSuggesties([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(query)}` +
          `&format=json&addressdetails=1&limit=6&countrycodes=be,nl`;
        const res  = await fetch(url, {
          headers: { "Accept-Language": "nl", "User-Agent": "ServrApp/1.0" },
        });
        const data: Suggestie[] = await res.json();
        setSuggesties(data);
        setOpen(data.length > 0);
      } catch {
        setSuggesties([]);
      } finally {
        setLoading(false);
      }
    }, 380);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const kiezen = (s: Suggestie) => {
    const adres = formatKort(s);
    setQuery(adres);
    setSuggesties([]);
    setOpen(false);
    onChange(adres, parseFloat(s.lat), parseFloat(s.lon));
  };

  const wissen = () => {
    setQuery("");
    setSuggesties([]);
    setOpen(false);
    onChange("", undefined, undefined);
  };

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <label className="text-xs font-bold uppercase mb-1.5 block"
          style={{ color: "var(--muted)" }}>
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: query ? accent : "var(--muted)" }} />

        <input
          type="text"
          autoComplete="off"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggesties.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3.5 rounded-2xl border outline-none text-sm transition-all"
          style={{
            borderColor: query ? accent : "var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
          }}
        />

        {/* Loader / clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 size={15} className="animate-spin" style={{ color: "var(--muted)" }} />
            : query
              ? <button onClick={wissen} className="touch-scale">
                  <X size={15} style={{ color: "var(--muted)" }} />
                </button>
              : null}
        </div>
      </div>

      {/* Dropdown */}
      {open && suggesties.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border overflow-hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          }}>
          {suggesties.map((s, i) => (
            <button key={s.place_id}
              onClick={() => kiezen(s)}
              className="touch-scale w-full text-left flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors"
              style={{ borderColor: "var(--border)" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: accent + "18" }}>
                <MapPin size={12} style={{ color: accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{formatKort(s)}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                  {formatSub(s)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
