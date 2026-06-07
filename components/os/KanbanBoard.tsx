"use client";

import type { TableRow } from "@/lib/os/parseMarkdownTable";

type Column = {
  key: string;
  label: string;
  rows: TableRow[];
  color: string;
};

function scoreColor(score: string): { bg: string; color: string } {
  const n = parseInt(score);
  if (isNaN(n)) return { bg: "#1f2937", color: "#6b7280" };
  if (n >= 18) return { bg: "#064e3b", color: "#10b981" };
  if (n >= 12) return { bg: "#78350f", color: "#f59e0b" };
  return { bg: "#7f1d1d", color: "#ef4444" };
}

function TaskCard({ row }: { row: TableRow }) {
  const taskKey = Object.keys(row).find(k => k.toLowerCase().includes("taak")) ?? Object.keys(row)[0];
  const requestKey = Object.keys(row).find(k => k.toLowerCase().includes("aanvrage") || k.toLowerCase().includes("bron"));
  const scoreKey = Object.keys(row).find(k => k.toLowerCase().includes("score"));

  const task = row[taskKey] ?? Object.values(row)[0] ?? "";
  const requester = requestKey ? row[requestKey] : "";
  const score = scoreKey ? row[scoreKey] : "";

  return (
    <div style={{
      background: "#111111", border: "1px solid #1f2937",
      borderRadius: 8, padding: "10px 12px",
      marginBottom: 8, cursor: "default",
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#374151")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1f2937")}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: "#f9fafb", margin: "0 0 6px", lineHeight: 1.4 }}>
        {task || "—"}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {requester && (
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 99,
            background: "#1f2937", color: "#9ca3af",
          }}>
            {requester}
          </span>
        )}
        {score && (() => { const sc = scoreColor(score); return (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
            background: sc.bg, color: sc.color,
          }}>
            {score}
          </span>
        ); })()}
      </div>
    </div>
  );
}

type Props = {
  sprintQueue: TableRow[];
  inProgress: TableRow[];
  approved: TableRow[];
  done: TableRow[];
};

export default function KanbanBoard({ sprintQueue, inProgress, approved, done }: Props) {
  const columns: Column[] = [
    { key: "queue",    label: "Queue",       rows: sprintQueue, color: "#ef4444" },
    { key: "progress", label: "In Progress", rows: inProgress,  color: "#f59e0b" },
    { key: "approved", label: "Approved",    rows: approved,    color: "#3b82f6" },
    { key: "done",     label: "Done",        rows: done,        color: "#10b981" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, height: "100%" }}>
      {columns.map(col => (
        <div key={col.key} style={{ display: "flex", flexDirection: "column" }}>
          {/* Column header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 10, padding: "0 4px",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: col.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {col.label}
            </span>
            <span style={{
              marginLeft: "auto",
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 99,
              background: "#1f2937", color: "#6b7280",
            }}>
              {col.rows.length}
            </span>
          </div>

          {/* Cards */}
          <div className="os-scroll" style={{ flex: 1, overflowY: "auto" }}>
            {col.rows.length === 0 ? (
              <div style={{
                border: "1px dashed #1f2937", borderRadius: 8,
                padding: "16px 12px", textAlign: "center",
                color: "#374151", fontSize: 11,
              }}>
                Leeg
              </div>
            ) : (
              col.rows.map((row, i) => <TaskCard key={i} row={row} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
