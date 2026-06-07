"use client";

import { RefreshCw } from "lucide-react";
import { useBacklog } from "@/hooks/useBacklog";
import KanbanBoard from "@/components/os/KanbanBoard";

export default function BacklogPage() {
  const { data, loading, refresh } = useBacklog(60000);
  const total = data.sprintQueue.length + data.inProgress.length + data.approvedTasks.length + data.done.length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "20px 24px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#f9fafb", margin: 0 }}>Backlog</h1>
          <p style={{ fontSize: 11, color: "#4b5563", margin: "3px 0 0" }}>
            {loading ? "Laden…" : `${total} taken totaal`}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 7,
            background: "#111111", border: "1px solid #1f2937",
            color: "#6b7280", fontSize: 12, cursor: "pointer",
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? "os-spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#4b5563", fontSize: 13 }}>
            Backlog laden…
          </div>
        ) : (
          <KanbanBoard
            sprintQueue={data.sprintQueue}
            inProgress={data.inProgress}
            approved={data.approvedTasks}
            done={data.done}
          />
        )}
      </div>
    </div>
  );
}
