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
  const collectedRef = useRef(""); // alles wat Edge tot nu toe heeft herkend
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (getSR()) setIsSupported(true);
  }, []);

  const startRecognition = useCallback(() => {
    const SR = getSR();
    if (!SR || !activeRef.current) return;

    try { recRef.current?.abort(); } catch {}

    collectedRef.current = "";

    const rec = new SR();
    rec.lang = "nl-BE";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += t;
        else interim += t;
      }

      // Sla alles op wat final is
      if (final) collectedRef.current = final.trim();

      // Toon live wat Edge hoort
      setRawTranscript(interim || final);

      // Stuur meteen als final beschikbaar (snelste pad)
      if (final.trim().length > 1) {
        collectedRef.current = "";
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
      // no-speech: herstart stil
      if (activeRef.current && (ev.error === "no-speech" || ev.error === "network")) {
        setTimeout(() => startRecognition(), 200);
      }
    };

    // onend: ALTIJD gestuurd (ook als onresult final miste)
    rec.onend = () => {
      const leftover = collectedRef.current.trim();
      collectedRef.current = "";
      setRawTranscript("");

      if (leftover.length > 1) {
        // Edge stuurde onend voor final result — stuur hier alsnog
        onCommandRef.current(leftover);
      }

      // Herstart voor volgend commando
      if (activeRef.current) {
        setTimeout(() => startRecognition(), 250);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      if (activeRef.current) setTimeout(() => startRecognition(), 500);
    }
  }, []);

  const start = useCallback(async () => {
    const SR = getSR();
    if (!SR) return;

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
    collectedRef.current = "";
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    activeRef.current = false;
    collectedRef.current = "";
    try { recRef.current?.abort(); } catch {}
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
