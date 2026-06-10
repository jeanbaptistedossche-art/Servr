"use client";

import { createContext, useContext, useRef, useCallback, useEffect } from "react";

export type OSEventType =
  | "NAVIGATE"
  | "HIGHLIGHT"
  | "AGENT_SWITCH"
  | "CODE_CHANGE"
  | "BUILD_STATUS"
  | "CTO_TASK_START"
  | "CTO_TASK_DONE"
  | "OPEN_PREVIEW";

type Handler = (payload: unknown) => void;

interface OSEventBusContextType {
  emit: (event: OSEventType, payload: unknown) => void;
  subscribe: (event: OSEventType, handler: Handler) => () => void;
}

const OSEventBusContext = createContext<OSEventBusContextType | null>(null);

export function OSEventBusProvider({ children }: { children: React.ReactNode }) {
  const handlers = useRef(new Map<OSEventType, Set<Handler>>());
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channel.current = new BroadcastChannel("servr-os-events");
    channel.current.onmessage = (e: MessageEvent<{ event: OSEventType; payload: unknown }>) => {
      const { event, payload } = e.data;
      handlers.current.get(event)?.forEach(h => h(payload));
    };
    return () => { channel.current?.close(); };
  }, []);

  const emit = useCallback((event: OSEventType, payload: unknown) => {
    handlers.current.get(event)?.forEach(h => h(payload));
    channel.current?.postMessage({ event, payload });
  }, []);

  const subscribe = useCallback((event: OSEventType, handler: Handler) => {
    if (!handlers.current.has(event)) handlers.current.set(event, new Set());
    handlers.current.get(event)!.add(handler);
    return () => { handlers.current.get(event)?.delete(handler); };
  }, []);

  return (
    <OSEventBusContext.Provider value={{ emit, subscribe }}>
      {children}
    </OSEventBusContext.Provider>
  );
}

export function useOSEventBus() {
  const ctx = useContext(OSEventBusContext);
  if (!ctx) throw new Error("useOSEventBus must be inside OSEventBusProvider");
  return ctx;
}
