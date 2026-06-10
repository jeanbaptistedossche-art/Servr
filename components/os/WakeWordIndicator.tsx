"use client";

import { useEffect } from "react";

type Props = {
  wakeWordMode: boolean;
  isAwake: boolean;
  isListeningForCommand: boolean;
  transcript: string;
  onToggle: () => void;
};

export default function WakeWordIndicator({
  wakeWordMode,
  isAwake,
  isListeningForCommand,
  transcript,
  onToggle,
}: Props) {
  // ESC to cancel
  useEffect(() => {
    if (!isAwake) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onToggle(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAwake, onToggle]);

  if (isAwake || isListeningForCommand) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99998,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
        flexDirection: "column", gap: 20,
        pointerEvents: "auto",
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          background: "#111", border: "1px solid #7c3aed44", borderRadius: 16,
          padding: "40px 48px",
        }}>
          <p style={{ margin: 0, color: "#7c3aed", fontWeight: 700, fontSize: 15, letterSpacing: "0.1em" }}>
            ⚡ SERVR LUISTERT
          </p>

          {/* Waveform */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 4, borderRadius: 2, background: "#7c3aed",
                  height: `${Math.sin(i * 0.8) * 16 + 20}px`,
                  animation: `waveBar 0.6s ease-in-out ${i * 0.05}s infinite alternate`,
                  opacity: 0.7 + (i % 3) * 0.1,
                }}
              />
            ))}
          </div>

          {transcript ? (
            <p style={{ margin: 0, color: "#e5e7eb", fontSize: 14, fontStyle: "italic", maxWidth: 300, textAlign: "center" }}>
              "{transcript}"
            </p>
          ) : (
            <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>
              Spreek je command in...
            </p>
          )}

          <button
            onClick={onToggle}
            style={{
              background: "transparent", border: "1px solid #374151",
              borderRadius: 6, padding: "6px 16px", color: "#6b7280",
              cursor: "pointer", fontSize: 12,
            }}
          >
            Annuleer (ESC)
          </button>
        </div>

        <style>{`
          @keyframes waveBar {
            from { transform: scaleY(0.5); }
            to { transform: scaleY(1.5); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    }}>
      <button
        onClick={onToggle}
        title={wakeWordMode ? 'Wake word actief — klik om uit te zetten' : 'Klik om microfoon te activeren\n"Hey Servr" om te praten'}
        style={{
          width: 52, height: 52, borderRadius: "50%",
          background: wakeWordMode ? "#7c3aed" : "#1a1a1a",
          border: `2px solid ${wakeWordMode ? "#7c3aed" : "#374151"}`,
          cursor: "pointer", fontSize: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: wakeWordMode ? "0 0 20px #7c3aed66" : "0 2px 8px rgba(0,0,0,0.5)",
          animation: wakeWordMode ? "wakeIdle 2s ease-in-out infinite" : "none",
          transition: "all 0.2s",
        }}
      >
        🎙️
      </button>
      <span style={{
        color: wakeWordMode ? "#7c3aed" : "#4b5563",
        fontSize: 9, letterSpacing: "0.05em", fontWeight: 700,
        textAlign: "center",
      }}>
        {wakeWordMode ? "HEY SERVR" : "MIC UIT"}
      </span>
      <style>{`
        @keyframes wakeIdle {
          0%, 100% { box-shadow: 0 0 8px #7c3aed44; }
          50% { box-shadow: 0 0 20px #7c3aed88; }
        }
      `}</style>
    </div>
  );
}
