"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, MapPin, Heart, CalendarDays, ChevronRight, Search } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";

const SERIF = "'Source Serif 4', Georgia, serif";

const FAVORIETEN = PROVIDERS.slice(0, 4);

export default function FavorietenPage() {
  const router = useRouter();
  const [verwijderd, setVerwijderd] = useState<string[]>([]);
  const actief = FAVORIETEN.filter(p => !verwijderd.includes(p.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/profile")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
              {actief.length} opgeslagen
            </p>
            <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>
              Favorieten
            </h2>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28">

        {/* Leeg */}
        {actief.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "#EDE4D2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Heart size={24} style={{ color: "#8A8A83" }} />
            </div>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: "#1A1D1A", margin: "0 0 8px" }}>
              Geen favorieten
            </p>
            <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 24px" }}>
              Sla vakmensen op om ze hier te zien.
            </p>
            <Link href="/search" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", background: "#2B4030", color: "#F5EFE5",
              borderRadius: 99, fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}>
              <Search size={14} /> Vakmensen zoeken
            </Link>
          </div>
        )}

        {/* Lijst */}
        {actief.map((p, i) => {
          const initial = p.name.charAt(0).toUpperCase();
          return (
            <div key={p.id} style={{
              background: "#FBF7F0", border: "0.5px solid #E5DDD0",
              borderRadius: 14, padding: 16, marginBottom: 10,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "#2B4030",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: SERIF, fontSize: 20, color: "#F5EFE5",
                  }}>{initial}</div>
                  {p.available && (
                    <span style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 11, height: 11, borderRadius: "50%",
                      background: "#2B4030", border: "2px solid #FBF7F0",
                    }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px", color: "#1A1D1A" }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: "#8A8A83", margin: "0 0 6px" }}>{p.category}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#C97A4D" }}>
                      <Star size={11} style={{ fill: "#C97A4D" }} />
                      <strong style={{ color: "#1A1D1A" }}>{p.rating}</strong>
                      <span style={{ color: "#8A8A83" }}>({p.reviewCount})</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#8A8A83" }}>
                      <MapPin size={11} /> {p.distance}
                    </span>
                  </div>
                  <p style={{ fontFamily: SERIF, fontSize: 14, color: "#2B4030", margin: "6px 0 0" }}>
                    Vanaf €{p.priceMin}/u
                  </p>
                </div>
              </div>

              {/* Acties */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "0.5px solid #E5DDD0" }}>
                <Link href={`/agenda/boeken/${p.id}`} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", background: "#2B4030", color: "#F5EFE5",
                  borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: "none",
                }}>
                  <CalendarDays size={13} /> Boeken
                </Link>
                <button onClick={() => setVerwijderd(v => [...v, p.id])} style={{
                  padding: "10px 14px", background: "transparent",
                  border: "0.5px solid #E5DDD0", borderRadius: 10,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  fontSize: 12, color: "#8A8A83",
                }}>
                  <Heart size={13} style={{ fill: "#C97A4D", color: "#C97A4D" }} /> Verwijder
                </button>
                <Link href={`/provider/${p.id}`} style={{
                  padding: "10px 12px", background: "transparent",
                  border: "0.5px solid #E5DDD0", borderRadius: 10,
                  display: "flex", alignItems: "center",
                  textDecoration: "none", color: "#5C5C56",
                }}>
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Meer zoeken */}
        {actief.length > 0 && (
          <Link href="/search" style={{
            display: "flex", alignItems: "center", gap: 12, padding: 14,
            background: "#FBF7F0", border: "0.5px dashed #C8C5BC",
            borderRadius: 14, textDecoration: "none", marginTop: 4,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: "#EDE4D2",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Search size={18} style={{ color: "#5C5C56" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>Meer vakmensen vinden</p>
              <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>Zoek en voeg toe aan je favorieten</p>
            </div>
            <ChevronRight size={14} style={{ color: "#8A8A83" }} />
          </Link>
        )}
      </div>
    </div>
  );
}
