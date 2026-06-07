"use client";

import { useState, useEffect } from "react";

type Activity = { emoji: string; text: string };

function parseActivities(stateText: string): Activity[] {
  const activities: Activity[] = [];

  const weekMatch = stateText.match(/## Wat er vorige week gebeurd is([\s\S]*?)(?=##|$)/);
  if (weekMatch) {
    weekMatch[1].split("\n").filter(l => l.trim().startsWith("-")).forEach(l => {
      activities.push({ emoji: "📋", text: l.replace(/^-\s*/, "").trim() });
    });
  }

  const ctoMatch = stateText.match(/⚙️ CTO RAPPORT([\s\S]*?)(?=##|$)/);
  if (ctoMatch) {
    ctoMatch[1].split("\n").filter(l => l.trim().startsWith("-") || l.includes("✅")).forEach(l => {
      const text = l.replace(/^[-\s]*/, "").replace(/^✅\s*/, "").trim();
      if (text) activities.push({ emoji: "⚙️", text });
    });
  }

  const sprintMatch = stateText.match(/## Huidige sprint focus([\s\S]*?)(?=##|$)/);
  if (sprintMatch) {
    const focus = sprintMatch[1].trim().split("\n")[0]?.replace(/^-\s*/, "").trim();
    if (focus) activities.push({ emoji: "🎯", text: `Sprint: ${focus}` });
  }

  return activities.length > 0
    ? activities
    : [{ emoji: "🚀", text: "Servr OS actief" }, { emoji: "📊", text: "WAT — north star metric" }];
}

export function useActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/os/state");
        const j = await res.json();
        setActivities(parseActivities(j.state ?? ""));
      } catch {}
    }
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return { activities, time };
}
