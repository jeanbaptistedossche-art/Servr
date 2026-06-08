"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type SR = typeof SpeechRecognition;

function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  return (
    (window as typeof window & { SpeechRecognition?: SR }).SpeechRecognition ??
    (window as typeof window & { webkitSpeechRecognition?: SR }).webkitSpeechRecognition ??
    null
  );
}

export type MicState = "off" | "permission-denied" | "listening";

export function useVoiceInput(onCommand: (text: string) => void) {
  const [micState, setMicState] = useState<MicState>("off");
  const [rawTranscript, setRawTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (getSR()) setIsSupported(true);
  }, []);

  const startRecognition = useCallback(() => {
    const SR = getSR();
    if (!SR || !activeRef.current) return;

    try { recRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = "nl-BE";
    rec.continuous = false;      // één zin per keer — meest stabiel in Edge
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += t;
        else interim += t;
      }

      // Toon wat Edge hoort in real-time
      setRawTranscript(interim || final);

      // Stuur wanneer final
      if (final.trim().length > 1) {
        setRawTranscript("");
        onCommandRef.current(final.trim());
      }
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "not-allowed") {
        activeRef.current = false;
        setMicState("permission-denied");
        setRawTranscript("");
        return;
      }
      // no-speech of ander: herstart automatisch
      if (activeRef.current && ev.error !== "aborted") {
        setTimeout(() => startRecognition(), 300);
      }
    };

    rec.onend = () => {
      setRawTranscript("");
      // Herstart automatisch zolang mic aan is
      if (activeRef.current) {
        setTimeout(() => startRecognition(), 200);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch {
      if (activeRef.current) setTimeout(() => startRecognition(), 500);
    }
  }, []);

  const start = useCallback(async () => {
    const SR = getSR();
    if (!SR) return;

    // Trigger permission popup in Edge
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      setMicState("permission-denied");
      return;
    }

    activeRef.current = true;
    setMicState("listening");
    setRawTranscript("");
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    activeRef.current = false;
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setMicState("off");
    setRawTranscript("");
  }, []);

  const toggle = useCallback(() => {
    if (micState === "off" || micState === "permission-denied") start();
    else stop();
  }, [micState, start, stop]);

  return { micState, rawTranscript, isSupported, toggle, stop };
}
