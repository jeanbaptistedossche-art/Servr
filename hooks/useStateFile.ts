"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useStateFile() {
  const [content, setContent] = useState("");
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [saved, setSaved]      = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/os/state");
      const j = await res.json();
      setContent(j.state ?? "");
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (text: string) => {
    setSaving(true);
    try {
      await fetch("/api/os/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: "STATE", content: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  }, []);

  const onChange = useCallback((text: string) => {
    setContent(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(text), 2000);
  }, [save]);

  return { content, loading, saving, saved, onChange, save, reload: load };
}
