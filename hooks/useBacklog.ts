"use client";

import { useState, useEffect, useCallback } from "react";
import { parseMarkdownTable, type TableRow } from "@/lib/os/parseMarkdownTable";

export type BacklogData = {
  sprintQueue: TableRow[];
  approvedTasks: TableRow[];
  marketSignals: TableRow[];
  inProgress: TableRow[];
  done: TableRow[];
  techDebt: TableRow[];
  raw: string;
};

const EMPTY: BacklogData = {
  sprintQueue: [], approvedTasks: [], marketSignals: [],
  inProgress: [], done: [], techDebt: [], raw: "",
};

export function useBacklog(autoRefreshMs = 60000) {
  const [data, setData] = useState<BacklogData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/os/backlog");
      const raw = await res.text();
      setData({
        raw,
        sprintQueue:    parseMarkdownTable(raw, "SPRINT_QUEUE"),
        approvedTasks:  parseMarkdownTable(raw, "APPROVED_TASKS"),
        marketSignals:  parseMarkdownTable(raw, "MARKET_SIGNALS"),
        inProgress:     parseMarkdownTable(raw, "IN_PROGRESS"),
        done:           parseMarkdownTable(raw, "DONE"),
        techDebt:       parseMarkdownTable(raw, "TECH_DEBT"),
      });
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(t);
  }, [refresh, autoRefreshMs]);

  return { data, loading, refresh };
}
