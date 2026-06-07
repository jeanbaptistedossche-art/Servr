"use client";

import { useState } from "react";
import { X, RotateCcw, ExternalLink } from "lucide-react";

type Props = {
  onClose: () => void;
  navigateTo?: string;
  highlightSelector?: string;
};

export default function AppPreview({ onClose, navigateTo, highlightSelector }: Props) {
  const [path, setPath] = useState(navigateTo ?? "/");
  const [inputPath, setInputPath] = useState(navigateTo ?? "/");
  const [key, setKey] = useState(0); // force iframe reload

  const src = `https://servr-nine.vercel.app${path}`;

  function navigate(p: string) {
    const newPath = p.startsWith("/") ? p : "/" + p;
    setPath(newPath);
    setInputPath(newPath);
    setKey(k => k + 1);
  }

  return (
    <div style={{
      width: "40%", minWidth: 320,
      display: "flex", flexDirection: "column",
      background: "#0d0d0d",
      borderLeft: "1px solid #1a1a1a",
    }}>
      {/* Header */}
      <div style={{
        height: 48, padding: "0 12px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid #1a1a1a",
        background: "#111111",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Servr App</span>
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          background: "#1a1a1a", borderRadius: 6, padding: "4px 8px",
        }}>
          <span style={{ fontSize: 10, color: "#4b5563", marginRight: 4 }}>servr-nine.vercel.app</span>
          <input
            value={inputPath}
            onChange={e => setInputPath(e.target.value)}
            onKeyDown={e => e.key === "Enter" && navigate(inputPath)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 11, color: "#9ca3af", fontFamily: "monospace",
            }}
          />
        </div>
        <button onClick={() => setKey(k => k + 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
          <RotateCcw size={13} />
        </button>
        <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280" }}>
          <ExternalLink size={13} />
        </a>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
          <X size={15} />
        </button>
      </div>

      {/* Iframe + highlight overlay */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <iframe
          key={key}
          src={src}
          style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
          title="Servr App Preview"
        />

        {/* Highlight tooltip overlay (cross-origin safe) */}
        {highlightSelector && (
          <div style={{
            position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
            background: "#1d4ed8", color: "#fff",
            padding: "8px 16px", borderRadius: 8,
            fontSize: 12, fontWeight: 500,
            boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
            display: "flex", alignItems: "center", gap: 8,
            animation: "os-pulse 2s infinite",
            pointerEvents: "none",
          }}>
            <span style={{ animation: "os-pulse 1s infinite" }}>👆</span>
            Agent wijst naar: <code style={{ fontFamily: "monospace" }}>{highlightSelector}</code>
          </div>
        )}
      </div>
    </div>
  );
}
