"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, RotateCcw, ExternalLink, Smartphone, Monitor, ArrowLeft, ArrowRight } from "lucide-react";
import { useOSEventBus } from "@/contexts/OSEventBusContext";

// Same-origin iframe: relative paths work, postMessage works for highlight
// This avoids all cross-origin restrictions

type ViewMode = "mobile" | "desktop";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/search": "Zoeken",
  "/dashboard": "Dashboard",
  "/berichten": "Berichten",
  "/feed": "Opdrachten feed",
  "/profile": "Profiel",
  "/agenda": "Agenda",
  "/panic": "Spoed",
  "/klanten": "Klanten",
  "/klussen": "Klussen",
  "/onboarding": "Onboarding",
  "/instellingen": "Instellingen",
  "/vakman-setup": "Vakman setup",
};

type Props = {
  onClose: () => void;
};

export default function AppPreviewPanel({ onClose }: Props) {
  const [path, setPath] = useState("/");
  const [inputVal, setInputVal] = useState("/");
  const [viewMode, setViewMode] = useState<ViewMode>("mobile");
  const [highlightMsg, setHighlightMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(["/"]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { subscribe } = useOSEventBus();

  function navigateTo(newPath: string) {
    const clean = newPath.startsWith("/") ? newPath : "/" + newPath;
    setPath(clean);
    setInputVal(clean);
    setHistory(prev => {
      const truncated = prev.slice(0, historyIdx + 1);
      return [...truncated, clean];
    });
    setHistoryIdx(prev => prev + 1);
  }

  function goBack() {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    const p = history[newIdx];
    setPath(p);
    setInputVal(p);
  }

  function goForward() {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    const p = history[newIdx];
    setPath(p);
    setInputVal(p);
  }

  function reload() {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }

  // Subscribe to event bus
  useEffect(() => {
    const unNav = subscribe("NAVIGATE", (p) => {
      if (typeof p === "string") navigateTo(p);
    });
    const unHl = subscribe("HIGHLIGHT", (sel) => {
      if (typeof sel === "string") {
        setHighlightMsg(sel);
        // postMessage to iframe (works same-origin in dev, best-effort in prod)
        iframeRef.current?.contentWindow?.postMessage(
          { type: "OS_HIGHLIGHT", selector: sel },
          "*"
        );
        setTimeout(() => setHighlightMsg(null), 3000);
      }
    });
    return () => { unNav(); unHl(); };
  }, [subscribe, historyIdx, history]);

  const label = ROUTE_LABELS[path.split("?")[0]] ?? path;

  return (
    <div style={{
      width: viewMode === "mobile" ? 460 : "40%",
      minWidth: viewMode === "mobile" ? 460 : 320,
      display: "flex", flexDirection: "column",
      background: "#080808",
      borderLeft: "1px solid #1a1a1a",
      transition: "width 0.25s ease",
    }}>
      {/* Browser chrome */}
      <div style={{
        background: "#0d0d0d", borderBottom: "1px solid #1a1a1a",
        padding: "6px 10px", flexShrink: 0,
      }}>
        {/* Top row: traffic lights + title + controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div onClick={onClose} style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }} title="Close" />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          </div>
          <span style={{ flex: 1, fontSize: 11, color: "#6b7280", textAlign: "center" }}>{label}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setViewMode(v => v === "mobile" ? "desktop" : "mobile")}
              style={{ background: "none", border: "none", cursor: "pointer", color: viewMode === "mobile" ? "#3b82f6" : "#4b5563", display: "flex" }}
              title={viewMode === "mobile" ? "Desktop view" : "Mobile view"}
            >
              {viewMode === "mobile" ? <Smartphone size={13} /> : <Monitor size={13} />}
            </button>
            <a href={path} target="_blank" rel="noopener noreferrer" style={{ color: "#4b5563", display: "flex", alignItems: "center" }}>
              <ExternalLink size={12} />
            </a>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", display: "flex" }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* URL bar row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={goBack} disabled={historyIdx <= 0} style={{ background: "none", border: "none", cursor: historyIdx > 0 ? "pointer" : "not-allowed", color: historyIdx > 0 ? "#6b7280" : "#2d2d2d", display: "flex" }}>
            <ArrowLeft size={13} />
          </button>
          <button onClick={goForward} disabled={historyIdx >= history.length - 1} style={{ background: "none", border: "none", cursor: historyIdx < history.length - 1 ? "pointer" : "not-allowed", color: historyIdx < history.length - 1 ? "#6b7280" : "#2d2d2d", display: "flex" }}>
            <ArrowRight size={13} />
          </button>
          <button onClick={reload} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", display: "flex" }}>
            <RotateCcw size={11} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#1a1a1a", borderRadius: 6, padding: "4px 8px" }}>
            <span style={{ fontSize: 10, color: "#374151", marginRight: 3 }}>localhost:3000</span>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && navigateTo(inputVal)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}
            />
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div style={{
        flex: 1, overflow: "auto",
        display: "flex", justifyContent: "center",
        background: "#1a1a1a",
        position: "relative",
      }}>
        <div style={{
          width: viewMode === "mobile" ? 390 : "100%",
          background: "#fff",
          position: "relative",
          minHeight: "100%",
        }}>
          <iframe
            ref={iframeRef}
            src={path}
            style={{ width: "100%", height: "100%", border: "none", minHeight: "100vh" }}
            title="Servr App Preview"
          />

          {/* Highlight overlay — cross-origin safe tooltip */}
          {highlightMsg && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "#1d4ed8", color: "#fff",
              padding: "8px 16px", borderRadius: 8,
              fontSize: 12, fontWeight: 500,
              boxShadow: "0 4px 20px rgba(59,130,246,0.5)",
              display: "flex", alignItems: "center", gap: 8,
              animation: "os-pulse 1.5s infinite",
              pointerEvents: "none", zIndex: 100, whiteSpace: "nowrap",
            }}>
              <span>👆</span>
              Agent wijst naar: <code style={{ fontFamily: "monospace", fontSize: 11 }}>{highlightMsg}</code>
            </div>
          )}
        </div>
      </div>

      {/* Quick nav chips */}
      <div style={{
        padding: "8px 10px", borderTop: "1px solid #1a1a1a",
        display: "flex", gap: 5, flexWrap: "wrap",
        background: "#0d0d0d",
      }}>
        {["/", "/search", "/feed", "/dashboard", "/berichten", "/panic"].map(p => (
          <button
            key={p}
            onClick={() => navigateTo(p)}
            style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 99,
              background: path === p ? "#1e3a5f" : "transparent",
              border: `1px solid ${path === p ? "#1e3a8a" : "#1f2937"}`,
              color: path === p ? "#3b82f6" : "#4b5563",
              cursor: "pointer",
            }}
          >
            {ROUTE_LABELS[p] ?? p}
          </button>
        ))}
      </div>
    </div>
  );
}
