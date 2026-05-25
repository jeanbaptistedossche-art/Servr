"use client";

import { useState, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Star, Navigation, Phone, X, ExternalLink } from "lucide-react";
import type { Provider } from "@/lib/mockData";

// Free Carto tile style — no API key required
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type Props = {
  providers: Provider[];
  height?: number | string;
  interactive?: boolean;
  showNavButtons?: boolean;
  zoom?: number;
  centerLat?: number;
  centerLng?: number;
};

export default function ProviderMap({
  providers,
  height = 300,
  interactive = true,
  showNavButtons = true,
  zoom = 13,
  centerLat = 52.3676,
  centerLng = 4.9041,
}: Props) {
  const [selected, setSelected] = useState<Provider | null>(null);

  const openWaze = useCallback((p: Provider) => {
    window.open(`https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes&zoom=17`, "_blank");
  }, []);

  const openGoogleMaps = useCallback((p: Provider) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, "_blank");
  }, []);

  return (
    <div className="relative overflow-hidden" style={{ height, borderRadius: 12 }}>
      <Map
        initialViewState={{ longitude: centerLng, latitude: centerLat, zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactive={interactive}
        attributionControl={false}
      >
        {interactive && (
          <NavigationControl position="bottom-right" showCompass={false} />
        )}

        {/* Provider pins */}
        {providers.map(p => (
          <Marker
            key={p.id}
            longitude={p.lng}
            latitude={p.lat}
            anchor="bottom"
            onClick={e => { e.originalEvent.stopPropagation(); setSelected(p); }}
          >
            <div
              className="flex flex-col items-center cursor-pointer touch-scale"
              style={{ transform: selected?.id === p.id ? "scale(1.2)" : "scale(1)", transition: "transform 0.15s" }}
            >
              {/* Price bubble */}
              <div
                className="px-2 py-1 rounded-full text-white text-[11px] font-bold shadow-md"
                style={{
                  background: p.available
                    ? (selected?.id === p.id ? "var(--teal-dark)" : "var(--teal)")
                    : "#94a3b8",
                  boxShadow: p.available ? "0 2px 8px rgba(15,110,86,0.4)" : "none",
                }}
              >
                €{p.priceMin}/u
              </div>
              {/* Stem */}
              <div
                style={{
                  width: 0, height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: `6px solid ${p.available ? (selected?.id === p.id ? "var(--teal-dark)" : "#0F6E56") : "#94a3b8"}`,
                }}
              />
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="top"
            onClose={() => setSelected(null)}
            closeButton={false}
            offset={16}
            maxWidth="280px"
          >
            <div style={{ fontFamily: "Inter, sans-serif", padding: "2px 0" }}>
              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#f1f5f9" }}
              >
                <X size={12} style={{ color: "#64748b" }} />
              </button>

              {/* Provider info */}
              <div className="flex items-center gap-2.5 mb-3 pr-6">
                <img src={selected.avatar} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{selected.name}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{selected.category}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">{selected.rating}</span>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>({selected.reviewCount})</span>
                    <span className="text-[10px] ml-1 font-bold" style={{ color: "var(--teal)" }}>
                      €{selected.priceMin}–{selected.priceMax}/u
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability badge */}
              <div className="flex items-center gap-1.5 mb-3">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: selected.available ? "#22c55e" : "#94a3b8" }}
                />
                <span className="text-xs font-medium" style={{ color: selected.available ? "#15803d" : "#94a3b8" }}>
                  {selected.available ? "Nu beschikbaar" : "Niet beschikbaar"}
                </span>
                <span className="text-xs ml-auto" style={{ color: "#94a3b8" }}>{selected.distance}</span>
              </div>

              {/* Action buttons */}
              {showNavButtons && (
                <div className="flex gap-1.5 mb-2">
                  <button
                    onClick={() => openWaze(selected)}
                    className="touch-scale flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: "#E8F8FB", color: "#0a93b5", border: "1px solid #B2EBF4" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C7.03 2 3 6.26 3 11.5c0 2.7 1.08 5.14 2.82 6.9l-.7 3.1 3.2-.85C9.5 21.5 10.72 22 12 22c4.97 0 9-4.26 9-9.5S16.97 2 12 2z" fill="#1EC9E3"/>
                      <ellipse cx="9.5" cy="11" rx="1.2" ry="1.2" fill="white"/>
                      <ellipse cx="14.5" cy="11" rx="1.2" ry="1.2" fill="white"/>
                      <path d="M9.5 14q2.5 1.8 5 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
                    </svg>
                    Waze
                  </button>
                  <button
                    onClick={() => openGoogleMaps(selected)}
                    className="touch-scale flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: "#FEF0EE", color: "#c53929", border: "1px solid #FECACA" }}
                  >
                    <svg width="13" height="15" viewBox="0 0 16 20" fill="none">
                      <path d="M8 0C4.13 0 1 3.13 1 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
                      <path d="M8 0C4.13 0 1 3.13 1 7c0 1.5.47 2.9 1.26 4.05L8 0z" fill="#4285F4"/>
                      <path d="M1.26 11.05C2.6 13.07 5.13 16.39 8 20c0 0-2.9-3.7-4.74-6.46L1.26 11.05z" fill="#FBBC05"/>
                      <circle cx="8" cy="7" r="2.5" fill="white"/>
                    </svg>
                    Maps
                  </button>
                  <a
                    href={`tel:${selected.phone}`}
                    className="touch-scale px-2.5 py-2 rounded-lg flex items-center justify-center"
                    style={{ background: "#0F6E5615", color: "var(--teal)", border: "1px solid #0F6E5630" }}
                  >
                    <Phone size={13} />
                  </a>
                </div>
              )}

              <Link
                href={`/provider/${selected.id}`}
                className="touch-scale flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-xs font-bold text-white"
                style={{ background: "var(--teal)" }}
              >
                Bekijk profiel <ExternalLink size={11} />
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Attribution */}
      <div
        className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded"
        style={{ background: "rgba(255,255,255,0.8)", color: "#94a3b8" }}
      >
        © OpenStreetMap · Carto
      </div>
    </div>
  );
}
